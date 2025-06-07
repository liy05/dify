from datetime import UTC, datetime

from flask_login import current_user
from flask_restful import Resource, marshal_with, reqparse
from werkzeug.exceptions import BadRequest, Forbidden, NotFound

from controllers.console import api
from controllers.console.wraps import (
    account_initialization_required,
    setup_required,
)
from extensions.ext_database import db
from fields.agent_category_fields import (
    agent_category_fields,
    agent_category_list_fields,
    agent_category_with_apps_fields,
)
from libs.login import login_required
from models.agent import AgentCategory, AgentCategoryApp
from models.model import App


class AgentCategoryListApi(Resource):
    @setup_required
    @login_required
    @account_initialization_required
    @marshal_with(agent_category_list_fields)
    def get(self):
        """获取智能体分类列表"""
        categories = (
            db.session.query(AgentCategory)
            .filter(AgentCategory.tenant_id == current_user.current_tenant_id)
            .order_by(AgentCategory.position.asc(), AgentCategory.created_at.asc())
            .all()
        )
        
        return {"categories": categories}

    @setup_required
    @login_required
    @account_initialization_required
    @marshal_with(agent_category_fields)
    def post(self):
        """创建智能体分类"""
        parser = reqparse.RequestParser()
        parser.add_argument("name", type=str, required=True, location="json")
        parser.add_argument("description", type=str, location="json")
        parser.add_argument("position", type=int, location="json")
        args = parser.parse_args()

        # 检查用户权限
        if not current_user.is_editor:
            raise Forbidden()

        # 检查同一租户下分类名称是否重复
        existing_category = (
            db.session.query(AgentCategory)
            .filter(
                AgentCategory.tenant_id == current_user.current_tenant_id,
                AgentCategory.name == args["name"]
            )
            .first()
        )
        if existing_category:
            raise BadRequest("Category name already exists")

        # 如果没有指定位置，设置为最后
        if not args.get("position"):
            max_position = (
                db.session.query(db.func.max(AgentCategory.position))
                .filter(AgentCategory.tenant_id == current_user.current_tenant_id)
                .scalar()
            ) or 0
            args["position"] = max_position + 1

        category = AgentCategory(
            tenant_id=current_user.current_tenant_id,
            name=args["name"],
            description=args.get("description", ""),
            position=args["position"],
            created_by=current_user.id,
            updated_by=current_user.id,
        )

        db.session.add(category)
        db.session.commit()

        return category


class AgentCategoryApi(Resource):
    @setup_required
    @login_required
    @account_initialization_required
    @marshal_with(agent_category_with_apps_fields)
    def get(self, category_id):
        """获取单个智能体分类详情（包含应用列表）"""
        category = (
            db.session.query(AgentCategory)
            .filter(
                AgentCategory.id == category_id,
                AgentCategory.tenant_id == current_user.current_tenant_id
            )
            .first()
        )
        
        if not category:
            raise NotFound("Category not found")
            
        return category

    @setup_required
    @login_required
    @account_initialization_required
    @marshal_with(agent_category_fields)
    def put(self, category_id):
        """更新智能体分类"""
        parser = reqparse.RequestParser()
        parser.add_argument("name", type=str, required=True, location="json")
        parser.add_argument("description", type=str, location="json")
        parser.add_argument("position", type=int, location="json")
        args = parser.parse_args()

        # 检查用户权限
        if not current_user.is_editor:
            raise Forbidden()

        category = (
            db.session.query(AgentCategory)
            .filter(
                AgentCategory.id == category_id,
                AgentCategory.tenant_id == current_user.current_tenant_id
            )
            .first()
        )
        
        if not category:
            raise NotFound("Category not found")

        # 检查名称是否与其他分类重复
        existing_category = (
            db.session.query(AgentCategory)
            .filter(
                AgentCategory.tenant_id == current_user.current_tenant_id,
                AgentCategory.name == args["name"],
                AgentCategory.id != category_id
            )
            .first()
        )
        if existing_category:
            raise BadRequest("Category name already exists")

        category.name = args["name"]
        category.description = args.get("description", "")
        if args.get("position") is not None:
            category.position = args["position"]
        category.updated_by = current_user.id
        category.updated_at = datetime.now(UTC).replace(tzinfo=None)

        db.session.commit()

        return category

    @setup_required
    @login_required
    @account_initialization_required
    def delete(self, category_id):
        """删除智能体分类"""
        # 检查用户权限
        if not current_user.is_editor:
            raise Forbidden()

        category = (
            db.session.query(AgentCategory)
            .filter(
                AgentCategory.id == category_id,
                AgentCategory.tenant_id == current_user.current_tenant_id
            )
            .first()
        )
        
        if not category:
            raise NotFound("Category not found")

        # 删除分类下的所有应用关联
        db.session.query(AgentCategoryApp).filter(
            AgentCategoryApp.category_id == category_id
        ).delete()

        # 删除分类
        db.session.delete(category)
        db.session.commit()

        return {"message": "Category deleted successfully"}


class AgentCategoryAppApi(Resource):
    @setup_required
    @login_required
    @account_initialization_required
    def post(self, category_id):
        """添加应用到分类"""
        parser = reqparse.RequestParser()
        parser.add_argument("app_id", type=str, required=True, location="json")
        parser.add_argument("position", type=int, location="json")
        args = parser.parse_args()

        # 检查用户权限
        if not current_user.is_editor:
            raise Forbidden()

        # 检查分类是否存在
        category = (
            db.session.query(AgentCategory)
            .filter(
                AgentCategory.id == category_id,
                AgentCategory.tenant_id == current_user.current_tenant_id
            )
            .first()
        )
        if not category:
            raise NotFound("Category not found")

        # 检查应用是否存在且属于当前租户
        app = (
            db.session.query(App)
            .filter(
                App.id == args["app_id"],
                App.tenant_id == current_user.current_tenant_id,
                App.status == "normal"
            )
            .first()
        )
        if not app:
            raise NotFound("App not found")

        # 检查应用是否已经在分类中
        existing_relation = (
            db.session.query(AgentCategoryApp)
            .filter(
                AgentCategoryApp.category_id == category_id,
                AgentCategoryApp.app_id == args["app_id"]
            )
            .first()
        )
        if existing_relation:
            raise BadRequest("App already exists in this category")

        # 如果没有指定位置，设置为最后
        if not args.get("position"):
            max_position = (
                db.session.query(db.func.max(AgentCategoryApp.position))
                .filter(AgentCategoryApp.category_id == category_id)
                .scalar()
            ) or 0
            args["position"] = max_position + 1

        category_app = AgentCategoryApp(
            category_id=category_id,
            app_id=args["app_id"],
            position=args["position"],
            created_by=current_user.id,
        )

        db.session.add(category_app)
        db.session.commit()

        return {"message": "App added to category successfully"}

    @setup_required
    @login_required
    @account_initialization_required
    def delete(self, category_id, app_id):
        """从分类中移除应用"""
        # 检查用户权限
        if not current_user.is_editor:
            raise Forbidden()

        # 检查分类是否存在
        category = (
            db.session.query(AgentCategory)
            .filter(
                AgentCategory.id == category_id,
                AgentCategory.tenant_id == current_user.current_tenant_id
            )
            .first()
        )
        if not category:
            raise NotFound("Category not found")

        # 查找并删除关联
        category_app = (
            db.session.query(AgentCategoryApp)
            .filter(
                AgentCategoryApp.category_id == category_id,
                AgentCategoryApp.app_id == app_id
            )
            .first()
        )
        
        if not category_app:
            raise NotFound("App not found in this category")

        db.session.delete(category_app)
        db.session.commit()

        return {"message": "App removed from category successfully"}


# 注册路由
api.add_resource(AgentCategoryListApi, "/agent-categories")
api.add_resource(AgentCategoryApi, "/agent-categories/<uuid:category_id>")
api.add_resource(
    AgentCategoryAppApi, 
    "/agent-categories/<uuid:category_id>/apps", 
    "/agent-categories/<uuid:category_id>/apps/<uuid:app_id>"
) 