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
        category_apps = (
            db.session.query(AgentCategoryApp)
            .filter(AgentCategoryApp.category_id == self.id)
            .order_by(AgentCategoryApp.position.asc())
            .all()
        )
        return [category_app.app for category_app in category_apps if category_app.app]


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
    app_id = db.Column(StringUUID, nullable=False)
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
        return db.session.query(App).filter(App.id == self.app_id).first() 