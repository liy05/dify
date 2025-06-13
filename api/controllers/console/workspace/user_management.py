import csv
import io
from datetime import UTC, datetime

from flask import request
from flask_login import current_user
from flask_restful import Resource, fields, marshal_with, reqparse
from sqlalchemy import and_, or_
from werkzeug.exceptions import BadRequest, Forbidden, NotFound

from controllers.console import api
from controllers.console.wraps import (
    account_initialization_required,
    setup_required,
)
from extensions.ext_database import db
from fields.member_fields import account_with_role_fields
from libs.login import login_required
from models.account import Account, TenantAccountJoin, TenantAccountRole
from services.account_service import AccountService, TenantService


class UserManagementListApi(Resource):
    """用户管理列表API"""

    @setup_required
    @login_required
    @account_initialization_required
    @marshal_with({"users": fields.List(fields.Nested(account_with_role_fields)), "total": fields.Integer})
    def get(self):
        """获取当前空间下的用户列表 - 仅管理员可访问"""
        if not current_user.is_admin_or_owner:
            raise Forbidden("Only admin or owner can access user management")

        parser = reqparse.RequestParser()
        parser.add_argument("page", type=int, default=1, location="args")
        parser.add_argument("limit", type=int, default=20, location="args")
        parser.add_argument("keyword", type=str, default="", location="args")
        args = parser.parse_args()

        # 构建查询
        query = (
            db.session.query(Account, TenantAccountJoin.role, TenantAccountJoin.created_at)
            .join(TenantAccountJoin, Account.id == TenantAccountJoin.account_id)
            .filter(TenantAccountJoin.tenant_id == current_user.current_tenant_id)
        )

        # 搜索过滤
        if args["keyword"]:
            keyword = f"%{args['keyword']}%"
            query = query.filter(
                or_(
                    Account.name.ilike(keyword),
                    Account.email.ilike(keyword),
                    Account.phone.ilike(keyword),
                    Account.wechat_work_id.ilike(keyword),
                )
            )

        # 获取总数
        total = query.count()

        # 分页
        offset = (args["page"] - 1) * args["limit"]
        results = query.order_by(TenantAccountJoin.created_at.desc()).offset(offset).limit(args["limit"]).all()

        # 构建返回数据
        users = []
        for account, role, join_created_at in results:
            user_data = {
                "id": account.id,
                "name": account.name,
                "email": account.email,
                "avatar": account.avatar,
                "avatar_url": f"/files/avatar/{account.id}" if account.avatar else None,
                "last_login_at": account.last_login_at,
                "last_active_at": account.last_active_at,
                "created_at": join_created_at,
                "role": role,
                "status": account.status,
                "wechat_work_id": account.wechat_work_id,
                "phone": account.phone,
            }
            users.append(user_data)

        return {"users": users, "total": total}

    @setup_required
    @login_required
    @account_initialization_required
    def post(self):
        """创建新用户 - 仅管理员可操作"""
        if not current_user.is_admin_or_owner:
            raise Forbidden("Only admin or owner can create users")

        parser = reqparse.RequestParser()
        parser.add_argument("name", type=str, required=True, location="json")
        parser.add_argument("email", type=str, required=True, location="json")
        parser.add_argument("password", type=str, location="json")
        parser.add_argument("role", type=str, default="normal", location="json")
        parser.add_argument("wechat_work_id", type=str, location="json")
        parser.add_argument("phone", type=str, location="json")
        args = parser.parse_args()

        # 验证角色
        if not TenantAccountRole.is_valid_role(args["role"]):
            raise BadRequest("Invalid role")

        # 检查邮箱是否已存在
        existing_account = db.session.query(Account).filter(Account.email == args["email"]).first()
        if existing_account:
            raise BadRequest("Email already exists")

        # 检查手机号是否已存在
        if args.get("phone"):
            existing_phone = db.session.query(Account).filter(Account.phone == args["phone"]).first()
            if existing_phone:
                raise BadRequest("Phone number already exists")

        # 检查企业微信ID是否已存在
        if args.get("wechat_work_id"):
            existing_wechat = db.session.query(Account).filter(Account.wechat_work_id == args["wechat_work_id"]).first()
            if existing_wechat:
                raise BadRequest("WeChat Work ID already exists")

        try:
            # 创建账户
            account = AccountService.create_account(
                email=args["email"],
                name=args["name"],
                password=args.get("password"),
                interface_language="zh-Hans",
                wechat_work_id=args.get("wechat_work_id"),
                phone=args.get("phone"),
            )

            # 添加到当前租户
            TenantService.add_member_to_tenant(
                tenant=current_user.current_tenant, account=account, role=args["role"], inviter=current_user
            )

            return {"message": "User created successfully", "user_id": account.id}, 201

        except Exception as e:
            db.session.rollback()
            raise BadRequest(f"Failed to create user: {str(e)}")


class UserManagementApi(Resource):
    """单个用户管理API"""

    @setup_required
    @login_required
    @account_initialization_required
    @marshal_with(account_with_role_fields)
    def get(self, user_id):
        """获取用户详情 - 仅管理员可访问"""
        if not current_user.is_admin_or_owner:
            raise Forbidden("Only admin or owner can access user details")

        # 查询用户及角色
        result = (
            db.session.query(Account, TenantAccountJoin.role)
            .join(TenantAccountJoin, Account.id == TenantAccountJoin.account_id)
            .filter(
                and_(
                    Account.id == user_id,
                    TenantAccountJoin.tenant_id == current_user.current_tenant_id,
                )
            )
            .first()
        )

        if not result:
            raise NotFound("User not found")

        account, role = result
        user_data = {
            "id": account.id,
            "name": account.name,
            "email": account.email,
            "avatar": account.avatar,
            "avatar_url": f"/files/avatar/{account.id}" if account.avatar else None,
            "last_login_at": account.last_login_at,
            "last_active_at": account.last_active_at,
            "created_at": account.created_at,
            "role": role,
            "status": account.status,
            "wechat_work_id": account.wechat_work_id,
            "phone": account.phone,
        }

        return user_data

    @setup_required
    @login_required
    @account_initialization_required
    def put(self, user_id):
        """更新用户信息 - 仅管理员可操作"""
        if not current_user.is_admin_or_owner:
            raise Forbidden("Only admin or owner can update users")

        parser = reqparse.RequestParser()
        parser.add_argument("name", type=str, location="json")
        parser.add_argument("email", type=str, location="json")
        parser.add_argument("role", type=str, location="json")
        parser.add_argument("status", type=str, location="json")
        parser.add_argument("wechat_work_id", type=str, location="json")
        parser.add_argument("phone", type=str, location="json")
        args = parser.parse_args()

        # 查询用户
        account = db.session.query(Account).filter(Account.id == user_id).first()
        if not account:
            raise NotFound("User not found")

        # 验证用户是否属于当前租户
        tenant_join = (
            db.session.query(TenantAccountJoin)
            .filter(
                and_(
                    TenantAccountJoin.account_id == user_id,
                    TenantAccountJoin.tenant_id == current_user.current_tenant_id,
                )
            )
            .first()
        )
        if not tenant_join:
            raise NotFound("User not found in current tenant")

        try:
            # 更新基本信息
            if args.get("name"):
                account.name = args["name"]
            if args.get("email"):
                # 检查邮箱是否已被其他用户使用
                existing = (
                    db.session.query(Account)
                    .filter(and_(Account.email == args["email"], Account.id != user_id))
                    .first()
                )
                if existing:
                    raise BadRequest("Email already exists")
                account.email = args["email"]

            if args.get("wechat_work_id"):
                # 检查企业微信ID是否已被其他用户使用
                existing = (
                    db.session.query(Account)
                    .filter(and_(Account.wechat_work_id == args["wechat_work_id"], Account.id != user_id))
                    .first()
                )
                if existing:
                    raise BadRequest("WeChat Work ID already exists")
                account.wechat_work_id = args["wechat_work_id"]

            if args.get("phone"):
                # 检查手机号是否已被其他用户使用
                existing = (
                    db.session.query(Account)
                    .filter(and_(Account.phone == args["phone"], Account.id != user_id))
                    .first()
                )
                if existing:
                    raise BadRequest("Phone number already exists")
                account.phone = args["phone"]

            if args.get("status"):
                account.status = args["status"]

            # 更新角色
            if args.get("role"):
                if not TenantAccountRole.is_valid_role(args["role"]):
                    raise BadRequest("Invalid role")
                TenantService.update_member_role(
                    tenant=current_user.current_tenant, member=account, new_role=args["role"], operator=current_user
                )

            account.updated_at = datetime.now(UTC).replace(tzinfo=None)
            db.session.commit()

            return {"message": "User updated successfully"}

        except Exception as e:
            db.session.rollback()
            raise BadRequest(f"Failed to update user: {str(e)}")

    @setup_required
    @login_required
    @account_initialization_required
    def delete(self, user_id):
        """删除用户 - 仅管理员可操作"""
        if not current_user.is_admin_or_owner:
            raise Forbidden("Only admin or owner can delete users")

        if user_id == current_user.id:
            raise BadRequest("Cannot delete yourself")

        # 查询用户
        account = db.session.query(Account).filter(Account.id == user_id).first()
        if not account:
            raise NotFound("User not found")

        try:
            # 从租户中移除用户
            TenantService.remove_member_from_tenant(
                tenant=current_user.current_tenant, account=account, operator=current_user
            )

            return {"message": "User removed successfully"}

        except Exception as e:
            db.session.rollback()
            raise BadRequest(f"Failed to remove user: {str(e)}")


class UserManagementImportApi(Resource):
    """用户批量导入API"""

    @setup_required
    @login_required
    @account_initialization_required
    def post(self):
        """批量导入用户 - 仅管理员可操作"""
        if not current_user.is_admin_or_owner:
            raise Forbidden("Only admin or owner can import users")

        # 检查是否有上传的文件
        if "file" not in request.files:
            raise BadRequest("No file uploaded")

        file = request.files["file"]
        
        if file.filename == "":
            raise BadRequest("No file selected")

        if not file.filename.lower().endswith(".csv"):
            raise BadRequest("Only CSV files are supported")

        try:
            # 读取CSV文件
            stream = io.StringIO(file.stream.read().decode("utf-8"), newline=None)
            csv_input = csv.DictReader(stream)

            success_count = 0
            failed_count = 0
            errors = []

            for row_num, row in enumerate(csv_input, start=2):  # 从第2行开始（第1行是标题）
                try:
                    # 验证必填字段
                    if not row.get("name") or not row.get("email"):
                        errors.append(f"Row {row_num}: Missing required fields (name, email)")
                        failed_count += 1
                        continue

                    # 检查邮箱是否已存在
                    existing_account = db.session.query(Account).filter(Account.email == row["email"]).first()
                    if existing_account:
                        errors.append(f"Row {row_num}: Email {row['email']} already exists")
                        failed_count += 1
                        continue

                    # 检查手机号是否已存在
                    if row.get("phone"):
                        existing_phone = db.session.query(Account).filter(Account.phone == row["phone"]).first()
                        if existing_phone:
                            errors.append(f"Row {row_num}: Phone {row['phone']} already exists")
                            failed_count += 1
                            continue

                    # 检查企业微信ID是否已存在
                    if row.get("wechat_work_id"):
                        existing_wechat = (
                            db.session.query(Account).filter(Account.wechat_work_id == row["wechat_work_id"]).first()
                        )
                        if existing_wechat:
                            errors.append(f"Row {row_num}: WeChat Work ID {row['wechat_work_id']} already exists")
                            failed_count += 1
                            continue

                    # 验证角色
                    role = row.get("role", "normal")
                    if not TenantAccountRole.is_valid_role(role):
                        errors.append(f"Row {row_num}: Invalid role {role}")
                        failed_count += 1
                        continue

                    # 创建账户
                    account = AccountService.create_account(
                        email=row["email"],
                        name=row["name"],
                        password=row.get("password"),
                        interface_language="zh-Hans",
                        wechat_work_id=row.get("wechat_work_id"),
                        phone=row.get("phone"),
                    )

                    # 添加到当前租户
                    TenantService.add_member_to_tenant(
                        tenant=current_user.current_tenant, account=account, role=role, inviter=current_user
                    )

                    success_count += 1

                except Exception as e:
                    errors.append(f"Row {row_num}: {str(e)}")
                    failed_count += 1
                    db.session.rollback()

            return {
                "message": "Import completed",
                "success_count": success_count,
                "failed_count": failed_count,
                "errors": errors,
            }

        except Exception as e:
            raise BadRequest(f"Failed to process CSV file: {str(e)}")


# 注册API路由
api.add_resource(UserManagementListApi, "/workspaces/current/users")
api.add_resource(UserManagementApi, "/workspaces/current/users/<string:user_id>")
api.add_resource(UserManagementImportApi, "/workspaces/current/users/import") 