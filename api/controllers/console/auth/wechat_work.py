import logging
from datetime import UTC, datetime

from flask import request
from flask_restful import Resource, reqparse
from werkzeug.exceptions import Unauthorized

from controllers.console import api
from extensions.ext_database import db
from libs.login import login_required
from models.account import Account, AccountStatus
from services.account_service import AccountService


class WeChatWorkAuthApi(Resource):
    """企业微信登录API"""

    def post(self):
        """企业微信登录"""
        parser = reqparse.RequestParser()
        parser.add_argument("wechat_work_id", type=str, required=True, location="json")
        parser.add_argument("name", type=str, location="json")
        parser.add_argument("email", type=str, location="json")
        args = parser.parse_args()

        try:
            # 查找用户
            account = db.session.query(Account).filter(Account.wechat_work_id == args["wechat_work_id"]).first()

            if not account:
                # 如果用户不存在，需要提供姓名和邮箱来创建新用户
                if not args.get("name") or not args.get("email"):
                    return {
                        "result": "user_not_found",
                        "message": "用户不存在，需要提供姓名和邮箱来创建账户",
                    }, 404

                # 检查邮箱是否已被使用
                existing_account = db.session.query(Account).filter(Account.email == args["email"]).first()
                if existing_account:
                    return {"result": "error", "message": "邮箱已被使用"}, 400

                # 创建新用户
                account = AccountService.create_account(
                    email=args["email"],
                    name=args["name"],
                    interface_language="zh-Hans",
                    wechat_work_id=args["wechat_work_id"],
                )
                account.status = AccountStatus.ACTIVE.value
                account.initialized_at = datetime.now(UTC).replace(tzinfo=None)
                db.session.commit()

            # 检查账户状态
            if account.status == AccountStatus.BANNED.value:
                raise Unauthorized("账户已被禁用")

            # 更新登录信息
            ip_address = request.remote_addr
            token_pair = AccountService.login(account=account, ip_address=ip_address)

            return {
                "result": "success",
                "data": {
                    "access_token": token_pair.access_token,
                    "refresh_token": token_pair.refresh_token,
                    "account": {
                        "id": account.id,
                        "name": account.name,
                        "email": account.email,
                        "avatar": account.avatar,
                        "wechat_work_id": account.wechat_work_id,
                    },
                },
            }

        except Exception as e:
            logging.exception("WeChat Work login failed")
            return {"result": "error", "message": str(e)}, 500


class WeChatWorkBindApi(Resource):
    """企业微信绑定API"""

    @login_required
    def post(self):
        """绑定企业微信ID"""
        parser = reqparse.RequestParser()
        parser.add_argument("wechat_work_id", type=str, required=True, location="json")
        args = parser.parse_args()

        from libs.login import current_user

        try:
            # 检查企业微信ID是否已被其他用户使用
            existing_account = (
                db.session.query(Account)
                .filter(Account.wechat_work_id == args["wechat_work_id"], Account.id != current_user.id)
                .first()
            )
            if existing_account:
                return {"result": "error", "message": "该企业微信ID已被其他用户绑定"}, 400

            # 绑定企业微信ID
            current_user.wechat_work_id = args["wechat_work_id"]
            current_user.updated_at = datetime.now(UTC).replace(tzinfo=None)
            db.session.commit()

            return {"result": "success", "message": "企业微信ID绑定成功"}

        except Exception as e:
            logging.exception("WeChat Work bind failed")
            return {"result": "error", "message": str(e)}, 500

    @login_required
    def delete(self):
        """解绑企业微信ID"""
        from libs.login import current_user

        try:
            current_user.wechat_work_id = None
            current_user.updated_at = datetime.now(UTC).replace(tzinfo=None)
            db.session.commit()

            return {"result": "success", "message": "企业微信ID解绑成功"}

        except Exception as e:
            logging.exception("WeChat Work unbind failed")
            return {"result": "error", "message": str(e)}, 500


# 注册API路由
api.add_resource(WeChatWorkAuthApi, "/auth/wechat-work")
api.add_resource(WeChatWorkBindApi, "/auth/wechat-work/bind") 