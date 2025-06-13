import logging
import random
import re
from datetime import UTC, datetime

from flask import request
from flask_restful import Resource, reqparse
from werkzeug.exceptions import Unauthorized

from controllers.console import api
from extensions.ext_database import db
from extensions.ext_redis import redis_client
from libs.login import login_required
from models.account import Account, AccountStatus
from services.account_service import AccountService


class PhoneSMSCodeApi(Resource):
    """手机验证码发送API"""

    def post(self):
        """发送手机验证码"""
        parser = reqparse.RequestParser()
        parser.add_argument("phone", type=str, required=True, location="json")
        args = parser.parse_args()

        phone = args["phone"]

        # 验证手机号格式
        if not self._is_valid_phone(phone):
            return {"result": "error", "message": "手机号格式不正确"}, 400

        try:
            # 检查发送频率限制
            rate_limit_key = f"sms_rate_limit:{phone}"
            if redis_client.get(rate_limit_key):
                return {"result": "error", "message": "验证码发送过于频繁，请稍后再试"}, 429

            # 生成6位验证码
            code = "".join([str(random.randint(0, 9)) for _ in range(6)])

            # 存储验证码（5分钟有效期）
            code_key = f"sms_code:{phone}"
            redis_client.setex(code_key, 300, code)  # 5分钟过期

            # 设置发送频率限制（60秒）
            redis_client.setex(rate_limit_key, 60, "1")

            # TODO: 这里应该调用实际的短信服务发送验证码
            # 目前为了演示，我们只是记录日志
            logging.info(f"SMS code for {phone}: {code}")

            # 在开发环境下，可以返回验证码用于测试
            # 生产环境应该移除这部分
            response_data = {"result": "success", "message": "验证码已发送"}
            if request.environ.get("FLASK_ENV") == "development":
                response_data["code"] = code  # 仅开发环境返回

            return response_data

        except Exception as e:
            logging.exception("SMS code send failed")
            return {"result": "error", "message": "验证码发送失败"}, 500

    def _is_valid_phone(self, phone: str) -> bool:
        """验证手机号格式"""
        # 简单的中国手机号验证
        pattern = r"^1[3-9]\d{9}$"
        return bool(re.match(pattern, phone))


class PhoneSMSAuthApi(Resource):
    """手机验证码登录API"""

    def post(self):
        """手机验证码登录"""
        parser = reqparse.RequestParser()
        parser.add_argument("phone", type=str, required=True, location="json")
        parser.add_argument("code", type=str, required=True, location="json")
        parser.add_argument("name", type=str, location="json")
        parser.add_argument("email", type=str, location="json")
        args = parser.parse_args()

        phone = args["phone"]
        code = args["code"]

        try:
            # 验证验证码
            code_key = f"sms_code:{phone}"
            stored_code = redis_client.get(code_key)

            if not stored_code or stored_code.decode() != code:
                return {"result": "error", "message": "验证码错误或已过期"}, 400

            # 删除已使用的验证码
            redis_client.delete(code_key)

            # 查找用户
            account = db.session.query(Account).filter(Account.phone == phone).first()

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
                    phone=phone,
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
                        "phone": account.phone,
                    },
                },
            }

        except Exception as e:
            logging.exception("Phone SMS login failed")
            return {"result": "error", "message": str(e)}, 500


class PhoneBindApi(Resource):
    """手机号绑定API"""

    @login_required
    def post(self):
        """绑定手机号"""
        parser = reqparse.RequestParser()
        parser.add_argument("phone", type=str, required=True, location="json")
        parser.add_argument("code", type=str, required=True, location="json")
        args = parser.parse_args()

        from libs.login import current_user

        phone = args["phone"]
        code = args["code"]

        try:
            # 验证验证码
            code_key = f"sms_code:{phone}"
            stored_code = redis_client.get(code_key)

            if not stored_code or stored_code.decode() != code:
                return {"result": "error", "message": "验证码错误或已过期"}, 400

            # 删除已使用的验证码
            redis_client.delete(code_key)

            # 检查手机号是否已被其他用户使用
            existing_account = (
                db.session.query(Account).filter(Account.phone == phone, Account.id != current_user.id).first()
            )
            if existing_account:
                return {"result": "error", "message": "该手机号已被其他用户绑定"}, 400

            # 绑定手机号
            current_user.phone = phone
            current_user.updated_at = datetime.now(UTC).replace(tzinfo=None)
            db.session.commit()

            return {"result": "success", "message": "手机号绑定成功"}

        except Exception as e:
            logging.exception("Phone bind failed")
            return {"result": "error", "message": str(e)}, 500

    @login_required
    def delete(self):
        """解绑手机号"""
        from libs.login import current_user

        try:
            current_user.phone = None
            current_user.updated_at = datetime.now(UTC).replace(tzinfo=None)
            db.session.commit()

            return {"result": "success", "message": "手机号解绑成功"}

        except Exception as e:
            logging.exception("Phone unbind failed")
            return {"result": "error", "message": str(e)}, 500


# 注册API路由
api.add_resource(PhoneSMSCodeApi, "/auth/phone/send-code")
api.add_resource(PhoneSMSAuthApi, "/auth/phone/login")
api.add_resource(PhoneBindApi, "/auth/phone/bind") 