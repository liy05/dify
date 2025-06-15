from sqlalchemy import func
from sqlalchemy.orm import Mapped

from models.base import Base
from models.model import App

from .engine import db
from .types import StringUUID


class AgentCategory(Base):
    """智能体分类模型"""
    __tablename__ = "agent_categories"
    __table_args__ = (
        db.PrimaryKeyConstraint("id", name="agent_category_pkey"),
        db.Index("agent_category_tenant_id_idx", "tenant_id"),
    )

    id = db.Column(StringUUID, server_default=db.text("uuid_generate_v4()"))
    tenant_id: Mapped[str] = db.Column(StringUUID, nullable=False)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    position = db.Column(db.Integer, nullable=False, server_default=db.text("0"))
    created_by = db.Column(StringUUID, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, server_default=func.current_timestamp())
    updated_by = db.Column(StringUUID, nullable=False)
    updated_at = db.Column(db.DateTime, nullable=False, server_default=func.current_timestamp())

    @property
    def apps(self):
        """获取分类下的应用"""
        try:
            category_apps = (
                db.session.query(AgentCategoryApp)
                .filter(AgentCategoryApp.category_id == self.id)
                .order_by(AgentCategoryApp.position.asc())
                .all()
            )
            return [category_app.to_dict() for category_app in category_apps] if category_apps else []
        except Exception as e:
            # 如果查询出错，返回空列表
            return []


class AgentCategoryApp(Base):
    """智能体分类应用关联模型"""
    __tablename__ = "agent_category_apps"
    __table_args__ = (
        db.PrimaryKeyConstraint("id", name="agent_category_app_pkey"),
        db.Index("agent_category_app_category_idx", "category_id"),
        db.Index("agent_category_app_app_idx", "app_id"),
        db.UniqueConstraint("category_id", "app_id", name="unique_category_app"),
        db.ForeignKeyConstraint(["category_id"], ["agent_categories.id"], name="fk_agent_category_apps_category_id"),
        db.ForeignKeyConstraint(["app_id"], ["apps.id"], name="fk_agent_category_apps_app_id"),
    )

    id = db.Column(StringUUID, server_default=db.text("uuid_generate_v4()"))
    category_id = db.Column(StringUUID, nullable=False)
    app_id = db.Column(StringUUID, nullable=True)  # 对于非应用类型项目，app_id可以为空
    item_type = db.Column(db.String(50), nullable=False, server_default=db.text("'app'"))  # 类型：app, markdown, url
    name = db.Column(db.String(255), nullable=True)  # 自定义名称
    description = db.Column(db.Text, nullable=True)  # 自定义描述
    icon = db.Column(db.String(255), nullable=True)  # 自定义图标
    icon_background = db.Column(db.String(7), nullable=True)  # 图标背景色
    markdown_content = db.Column(db.Text, nullable=True)  # Markdown内容
    url = db.Column(db.String(1000), nullable=True)  # URL地址
    position = db.Column(db.Integer, nullable=False, server_default=db.text("0"))
    created_by = db.Column(StringUUID, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, server_default=func.current_timestamp())

    @property
    def category(self):
        """获取关联的分类"""
        return db.session.query(AgentCategory).filter(AgentCategory.id == self.category_id).first()

    @property
    def app(self):
        """获取关联的应用"""
        if self.app_id:
            app = db.session.query(App).filter(App.id == self.app_id).first()
            return app
        else:
            return None
    
    def to_dict(self):
        """转换为字典格式"""
        try:
            if self.item_type == 'app':
                # 应用类型，返回应用信息
                if self.app:
                    # 生成icon_url
                    icon_url = None
                    if self.app.icon_type == 'image' and self.app.icon:
                        from libs import file_helpers
                        icon_url = file_helpers.get_signed_file_url(self.app.icon)
                    
                    return {
                        'id': self.id,
                        'item_type': self.item_type,
                        'name': self.app.name,
                        'description': self.app.description,
                        'mode': self.app.mode,
                        'icon_type': self.app.icon_type,
                        'icon': self.app.icon,
                        'icon_background': self.app.icon_background,
                        'icon_url': icon_url,
                        'site_code': self.app.site.code if self.app.site else None,
                        'app_id': self.app.id
                    }
                else:
                    return {
                        'id': self.id,
                        'item_type': self.item_type,
                        'name': f'应用 {self.app_id}',
                        'description': '应用不存在或已删除',
                        'icon': '❓',
                        'icon_background': '#6366f1',
                        'app_id': self.app_id
                    }
            else:
                # 自定义类型（markdown或url）
                return {
                    'id': self.id,
                    'item_type': self.item_type or 'app',
                    'name': self.name,
                    'description': self.description,
                    'icon': self.icon or ('📄' if self.item_type == 'markdown' else '🔗'),
                    'icon_background': self.icon_background or '#6366f1',
                    'markdown_content': self.markdown_content if self.item_type == 'markdown' else None,
                    'url': self.url if self.item_type == 'url' else None,
                }
        except Exception as e:
            # 如果转换出错，返回基本信息
            return {
                'id': self.id,
                'item_type': self.item_type or 'app',
                'name': self.name or 'Error',
                'description': self.description,
                'icon': '❓',
                'icon_background': '#6366f1',
            } 