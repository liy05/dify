import re
import logging
from flask import request, jsonify
from flask_restful import Resource
from werkzeug.security import generate_password_hash
from models.account import Account
from services.account_service import AccountService
from services.sms_service import send_sms, verify_code
from extensions.ext_redis import redis_client
from extensions.ext_database import db

logger = logging.getLogger(__name__)


class PhoneSMSCodeApi(Resource):
    """手机验证码发送API"""

    def post(self):
        """发送手机验证码"""
        data = request.get_json()
        phone = data.get('phone')
        language = data.get('language', 'zh-Hans')

        if not phone:
            return {'result': 'fail', 'message': 'Phone number is required'}, 400

        # 验证手机号格式
        if not self._is_valid_phone(phone):
            return {'result': 'fail', 'message': 'Invalid phone number format'}, 400

        # 检查发送频率限制
        rate_limit_key = f'phone_sms_rate_limit:{phone}'
        if redis_client.get(rate_limit_key):
            return {'result': 'fail', 'message': '验证码发送太频繁，请60秒后再试'}, 429

        # 发送验证码
        result = send_sms(phone)
        if not result['success']:
            return {'result': 'fail', 'message': result['message']}, 500

        # 生成验证token（用于验证码验证时的安全校验）
        import uuid
        verification_token = str(uuid.uuid4())
        
        # 将token存储到Redis，与手机号关联，设置5分钟过期
        redis_client.setex(f'phone_verification_token:{phone}', 300, verification_token)

        # 设置发送频率限制（60秒）
        redis_client.setex(rate_limit_key, 60, "1")

        return {'result': 'success', 'data': verification_token}, 200

    def _is_valid_phone(self, phone: str) -> bool:
        """验证手机号格式"""
        # 简单的中国手机号验证
        pattern = r"^1[3-9]\d{9}$"
        return bool(re.match(pattern, phone))


class PhoneSMSAuthApi(Resource):
    """手机验证码登录API"""

    def post(self):
        """使用手机验证码登录"""
        data = request.get_json()
        phone = data.get('phone')
        code = data.get('code')
        token = data.get('token')  # 用于邀请链接的场景

        if not all([phone, code]):
            return {'result': 'fail', 'message': 'Phone number and verification code are required'}, 400

        # 验证手机号格式
        if not PhoneSMSCodeApi()._is_valid_phone(phone):
            return {'result': 'fail', 'message': 'Invalid phone number format'}, 400

        # 验证token的有效性
        stored_token = redis_client.get(f'phone_verification_token:{phone}')
        if not stored_token or stored_token.decode('utf-8') != token:
            return {'result': 'fail', 'message': 'Invalid or expired verification token'}, 400

        # 验证验证码
        if not verify_code(phone, code):
            return {'result': 'fail', 'message': 'Invalid or expired verification code'}, 400
        
        # 验证成功后删除token，防止重复使用
        redis_client.delete(f'phone_verification_token:{phone}')

        # 查找或创建用户
        account = db.session.query(Account).filter_by(phone=phone).first()
        if not account:
            # 如果是邀请链接场景，使用邀请token创建账号
            if token:
                account = AccountService.create_account_by_invite_token(token)
                if not account:
                    return {'result': 'fail', 'message': 'Invalid invite token'}, 400
                account.phone = phone
            else:
                # 创建新账号和工作空间
                try:
                    account = AccountService.create_account_and_tenant(
                        email=f'{phone}@phone.local',  # 临时邮箱
                        name=f'User_{phone[-4:]}',
                        interface_language='zh-Hans'
                    )
                    account.phone = phone
                    db.session.commit()
                except Exception as e:
                    logger.error(f"创建账号和工作空间失败: {e}")
                    return {'result': 'fail', 'message': 'Failed to create account'}, 500

        # 检查工作空间（参考邮箱登录逻辑）
        from services.account_service import TenantService
        from services.feature_service import FeatureService
        
        tenants = TenantService.get_join_tenants(account)
        if len(tenants) == 0:
            system_features = FeatureService.get_system_features()
            if system_features.is_allow_create_workspace and not system_features.license.workspaces.is_available():
                return {'result': 'fail', 'message': 'Workspaces limit exceeded'}, 400
            else:
                return {
                    'result': 'fail',
                    'message': 'workspace not found, please contact system admin to invite you to join in a workspace',
                }, 400

        # 登录用户
        ip_address = request.remote_addr
        token_pair = AccountService.login(account=account, ip_address=ip_address)

        response_data = {"result": "success", "data": token_pair.model_dump()}
        logger.info(f"手机登录成功，返回数据: {response_data}")
        return response_data 