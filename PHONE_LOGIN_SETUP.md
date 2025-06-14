# 手机号验证码登录功能设置指南

## 功能概述

Dify 已完整实现手机号验证码登录功能，包括：
- 手机号格式验证（支持中国大陆手机号）
- 阿里云短信服务集成
- 验证码发送和验证
- 用户自动注册
- 完整的前端用户界面
- **优化的用户体验：在同一页面完成手机号输入和验证码验证**

## 用户体验流程

### 新的登录页面设计
1. **登录方式选择**：用户在登录页面可以选择"使用手机号码登录"
2. **手机号输入**：输入手机号码，点击"获取验证码"
3. **验证码输入**：在同一页面切换到验证码输入界面
   - 显示已发送验证码的手机号（脱敏显示）
   - 6位数字验证码输入框
   - 60秒倒计时重新发送功能
   - 返回按钮可回到手机号输入步骤
4. **登录成功**：验证通过后自动登录系统

### 界面特性
- **单页面流程**：无需页面跳转，用户体验更流畅
- **清晰的视觉反馈**：每个步骤都有明确的提示信息
- **错误处理**：完善的错误提示和处理机制
- **响应式设计**：适配不同屏幕尺寸

## 配置步骤

### 1. 环境变量配置

在 `.env` 文件中添加以下配置：

```bash
# 启用手机号登录
ENABLE_PHONE_LOGIN=true

# 阿里云短信服务配置
ALIYUN_ACCESS_KEY_ID=your_access_key_id
ALIYUN_ACCESS_KEY_SECRET=your_access_key_secret
ALIYUN_SMS_SIGN_NAME=your_sms_sign_name
ALIYUN_SMS_TEMPLATE_CODE=your_template_code
ALIYUN_SMS_CODE_EXPIRE_SECONDS=300
```

### 2. 阿里云短信服务设置

1. **开通服务**：
   - 登录阿里云控制台
   - 开通短信服务
   - 创建 AccessKey

2. **配置签名和模板**：
   - 创建短信签名（需要审核）
   - 创建短信模板，包含验证码变量 `${code}`
   - 记录签名名称和模板CODE

### 3. 重启服务

```bash
# 重启后端服务
docker-compose restart api

# 或者如果是开发环境
python -m flask run
```

## API 接口

### 发送验证码
```http
POST /console/api/phone/send-verification-code
Content-Type: application/json

{
  "phone": "13800138000"
}
```

### 验证码登录
```http
POST /console/api/phone/login
Content-Type: application/json

{
  "phone": "13800138000",
  "code": "123456",
  "token": "verification_token"
}
```

## 安全特性

- **验证码有效期**：5分钟自动过期
- **发送频率限制**：60秒内只能发送一次
- **一次性使用**：验证码验证后立即失效
- **格式验证**：严格的手机号和验证码格式检查
- **自动用户注册**：新手机号自动创建用户账户

## 故障排除

### 常见问题

1. **404 错误**：
   - 确认 `ENABLE_PHONE_LOGIN=true` 已设置
   - 检查后端服务是否重启

2. **验证码发送失败**：
   - 检查阿里云配置是否正确
   - 确认短信签名和模板已审核通过
   - 查看后端日志获取详细错误信息

3. **验证码验证失败**：
   - 确认验证码未过期（5分钟内）
   - 检查验证码输入是否正确
   - 确认手机号格式正确

### 日志查看

```bash
# 查看后端日志
docker-compose logs api

# 查看特定错误
docker-compose logs api | grep -i error
```

## 开发信息

### 前端组件
- `PhoneAndCodeAuth`：手机号登录主组件
- 位置：`web/app/signin/components/phone-and-code-auth.tsx`
- 特性：单页面双步骤流程，优化用户体验

### 后端服务
- SMS服务：`api/services/sms_service.py`
- 控制器：`api/controllers/console/auth/phone_sms.py`
- 配置：`api/configs/feature/__init__.py`

### 数据库
- 用户表自动创建新用户
- 手机号作为唯一标识
- 支持与邮箱登录用户共存

## 更新日志

### v1.4.1 - 最新修复
- ✅ 修复配置系统集成问题
- ✅ 优化登录页面用户体验
- ✅ 实现单页面双步骤流程
- ✅ 添加完善的错误处理和用户反馈
- ✅ 支持返回和重新发送功能
- ✅ **修复API路由和响应格式问题**
- ✅ **修复前后端接口不匹配问题**
- ✅ **确保验证码输入界面正常显示**
- ✅ **修复token生成和验证逻辑**
- ✅ **完善安全验证机制**

### 关键修复内容
1. **API路径重复问题修复**：
   - 问题：前端调用路径重复 `/console/api/console/api/phone/...`
   - 解决：修正前端API调用路径为 `/phone/send-verification-code` 和 `/phone/login`
   - 最终正确路径：`http://localhost:5001/console/api/phone/send-verification-code`

2. **响应格式统一**：
   - 成功响应：`{"result": "success", "data": "..."}`
   - 失败响应：`{"result": "fail", "message": "..."}`

3. **前端组件优化**：
   - 修复状态切换逻辑
   - 添加调试日志
   - 优化错误处理

4. **路由注册修复**：
   - 后端路由：`/phone/send-verification-code` 和 `/phone/login`
   - 确保前后端路径完全匹配

5. **Token安全机制**：
   - 发送验证码时生成UUID token
   - Token存储在Redis中，5分钟过期
   - 登录时验证token有效性，防止重放攻击
   - 验证成功后立即删除token，确保一次性使用

6. **数据库查询修复**：
   - 问题：`Account.query.filter_by()` 导致 AttributeError
   - 解决：改为 `db.session.query(Account).filter_by()`
   - 删除不存在的数据库字段（social_provider, social_id）

7. **JSON序列化修复**：
   - 问题：datetime对象无法序列化为JSON导致500错误
   - 解决：将datetime字段转换为ISO格式字符串
   - 修复：`account.created_at.isoformat() if account.created_at else None`

8. **开发环境判断修复**：
   - 问题：使用了错误的环境变量 `FLASK_ENV`
   - 解决：改为使用 `dify_config.DEBUG` 或 `dify_config.DEPLOY_ENV == 'DEVELOPMENT'`
   - 确保开发环境下正确模拟短信发送

9. **登录成功跳转优化**：
   - 添加登录成功提示信息
   - 增加调试日志便于排查问题
   - 添加短暂延迟确保token设置完成
   - 优化用户体验和反馈

10. **登录状态处理修复**：
    - 问题：使用 `router.replace` 跳转后，`SwrInitor` 组件仍使用旧的localStorage值
    - 解决：改用 `window.location.href` 进行硬刷新，确保重新读取localStorage
    - 确保登录状态正确识别，避免跳转后被重定向回登录页面

### 最终状态
✅ **功能完全正常**：手机号验证码登录功能已完整实现并修复所有已知问题
- API接口正常响应（JSON格式正确）
- 前端界面正常显示验证码输入框
- 数据库查询正常工作
- JSON序列化问题已解决
- 开发环境判断正确
- 登录成功后正确跳转到首页
- 安全机制完善
- 用户体验优化

### 使用说明
1. **开发环境测试**：
   - 系统会自动模拟短信发送，无需真实阿里云配置
   - 查看控制台日志可以看到模拟发送的验证码
   - 使用模拟的验证码进行登录测试

2. **生产环境部署**：
   - 配置真实的阿里云短信服务环境变量
   - 设置 `DEBUG=false` 和 `DEPLOY_ENV=PRODUCTION`
   - 确保短信签名和模板已通过审核 