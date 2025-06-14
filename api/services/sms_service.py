import json
import logging
import secrets
import uuid

try:
    from aliyunsdkcore.acs_exception.exceptions import ClientException, ServerException
    from aliyunsdkcore.client import AcsClient
    from aliyunsdkcore.request import CommonRequest
    ALIYUN_SMS_AVAILABLE = True
except ImportError:
    ALIYUN_SMS_AVAILABLE = False

from configs import dify_config
from extensions.ext_redis import redis_client

log = logging.getLogger(__name__)
log.setLevel(logging.INFO)

def generate_verification_code(length: int = 6) -> str:
    """
    生成指定长度的随机验证码
    :param length: 验证码长度
    :return: 随机验证码字符串
    """
    return ''.join(secrets.choice('0123456789') for _ in range(length))

def send_sms(phone_number: str) -> dict:
    """
    发送短信验证码
    :param phone_number: 接收短信的手机号
    :return: 发送结果字典
    """
    # 如果阿里云SDK未安装，返回错误
    if not ALIYUN_SMS_AVAILABLE:
        log.error("阿里云SDK未安装，无法发送短信")
        return {
            "success": False,
            "message": "阿里云SDK未安装，无法发送短信",
            "error": "Module not found"
        }
    
    # 如果没有配置阿里云参数，返回错误
    if not all([dify_config.ALIYUN_ACCESS_KEY_ID, dify_config.ALIYUN_ACCESS_KEY_SECRET, 
                dify_config.ALIYUN_SMS_SIGN_NAME, dify_config.ALIYUN_SMS_TEMPLATE_CODE]):
        log.error("阿里云短信服务参数未配置")
        return {
            "success": False,
            "message": "阿里云短信服务参数未配置",
            "error": "Configuration missing"
        }
    
    code = generate_verification_code()
    
    try:
        # 创建AcsClient实例
        client = AcsClient(dify_config.ALIYUN_ACCESS_KEY_ID, dify_config.ALIYUN_ACCESS_KEY_SECRET, 'cn-hangzhou')
        
        # 组装请求对象
        request = CommonRequest()
        request.set_accept_format('json')
        request.set_domain('dysmsapi.aliyuncs.com')
        request.set_method('POST')
        request.set_protocol_type('https')
        request.set_version('2017-05-25')
        request.set_action_name('SendSms')
        
        # 设置短信相关的请求参数
        request.add_query_param('RegionId', 'cn-hangzhou')
        request.add_query_param('PhoneNumbers', phone_number)
        request.add_query_param('SignName', dify_config.ALIYUN_SMS_SIGN_NAME)
        request.add_query_param('TemplateCode', dify_config.ALIYUN_SMS_TEMPLATE_CODE)
        
        # 设置短信模板变量
        template_param = {
            'code': code,
            'expire': str(dify_config.SMS_CODE_EXPIRE_SECONDS // 60)  # 将秒转换为分钟
        }
        request.add_query_param('TemplateParam', json.dumps(template_param))
        
        # 发送短信请求
        # 开发环境下模拟短信发送
        if dify_config.DEBUG or dify_config.DEPLOY_ENV == 'DEVELOPMENT':
            log.info(f"开发环境模拟发送短信 - 手机号: {phone_number}, 验证码: {code}")
            response_json = {
                'Code': 'OK',
                'RequestId': str(uuid.uuid4()),
                'BizId': str(uuid.uuid4()),
                'Message': 'OK'
            }
        else:
            # 生产环境实际发送短信
            response = client.do_action_with_exception(request)
            response_json = json.loads(response.decode('utf-8'))
        
        # 记录结果
        if response_json.get('Code') == 'OK':
            # 存储验证码和过期时间到 Redis
            redis_client.setex(f'sms_code:{phone_number}', dify_config.SMS_CODE_EXPIRE_SECONDS, code)
            
            log.info(f"短信发送成功 - 手机号: {phone_number}, 验证码: {code}")
            result = {
                'success': True,
                'message': '短信发送成功',
                'request_id': response_json.get('RequestId'),
                'bizid': response_json.get('BizId'),
            }
        else:
            log.error(f"短信发送失败 - 手机号: {phone_number}, 错误: {response_json}")
            result = {
                'success': False,
                'message': '短信发送失败',
                'request_id': response_json.get('RequestId'),
                'code': response_json.get('Code'),
                'message_detail': response_json.get('Message')
            }
        return result
        
    except ClientException as e:
        log.exception(f"客户端错误 - {e.get_error_code()}: {e.get_error_msg()}")
        return {
            'success': False,
            'message': f"客户端错误: {e.get_error_msg()}"
        }
    except ServerException as e:
        log.exception(f"服务器错误 - {e.get_error_code()}: {e.get_error_msg()}")
        return {
            'success': False,
            'message': f"服务器错误: {e.get_error_msg()}"
        }
    except Exception as e:
        log.exception("未知错误")
        return {
            'success': False,
            'message': f"未知错误: {str(e)}"
        }

def verify_code(phone_number: str, code: str) -> bool:
    """
    验证短信验证码
    :param phone_number: 手机号
    :param code: 用户输入的验证码
    :return: 验证是否通过
    """
    stored_code = redis_client.get(f'sms_code:{phone_number}')
    if not stored_code:
        return False
    
    # 验证码匹配
    if stored_code.decode('utf-8') == code:
        # 验证通过后，删除该验证码防止重复使用
        redis_client.delete(f'sms_code:{phone_number}')
        return True
    
    return False 