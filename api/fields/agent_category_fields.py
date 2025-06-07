from flask_restful import fields

from libs.helper import AppIconUrlField, TimestampField

# 应用字段
app_simple_fields = {
    "id": fields.String,
    "name": fields.String,
    "description": fields.String,
    "mode": fields.String,
    "icon_type": fields.String,
    "icon": fields.String,
    "icon_background": fields.String,
    "icon_url": AppIconUrlField,
    "site_code": fields.String(attribute="site.code"),
}

# 智能体分类字段
agent_category_fields = {
    "id": fields.String,
    "name": fields.String,
    "description": fields.String,
    "position": fields.Integer,
    "created_at": TimestampField,
    "updated_at": TimestampField,
}

# 带应用列表的智能体分类字段
agent_category_with_apps_fields = {
    "id": fields.String,
    "name": fields.String,
    "description": fields.String,
    "position": fields.Integer,
    "apps": fields.List(fields.Nested(app_simple_fields)),
    "created_at": TimestampField,
    "updated_at": TimestampField,
}

# 智能体分类列表字段
agent_category_list_fields = {
    "categories": fields.List(fields.Nested(agent_category_with_apps_fields))
} 