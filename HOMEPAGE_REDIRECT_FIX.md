# 首页重定向修改 - 从 /app 改为 /home

## 需求描述
用户希望访问域名时默认进入 `/home` 页面而不是 `/app` 页面，将 `/home` 设置为首页。

## 问题分析

### 原始配置
在 `web/next.config.js` 中发现了根路径重定向配置：

```javascript
async redirects() {
  return [
    {
      source: '/',
      destination: '/apps',  // 原来重定向到 /apps
      permanent: false,
    },
  ]
},
```

### 重定向优先级
Next.js 中重定向的优先级顺序：
1. **`next.config.js` 中的 `redirects`** (最高优先级)
2. 页面级的 `redirect()` 函数
3. 组件内的重定向

即使 `web/app/page.tsx` 中设置了 `redirect('/home')`，`next.config.js` 中的配置会优先生效。

## 解决方案

### 修改配置
在 `web/next.config.js` 中修改重定向目标：

```javascript
async redirects() {
  return [
    {
      source: '/',
      destination: '/home',  // 修改为重定向到 /home
      permanent: false,
    },
  ]
},
```

### 页面配置
确认 `/home` 页面存在并且配置正确：

**文件**: `web/app/home/page.tsx`
- ✅ 页面存在
- ✅ 实现了AI服务平台首页功能
- ✅ 包含智能体分类展示
- ✅ 响应式设计

**文件**: `web/app/page.tsx`
```typescript
import { redirect } from 'next/navigation'

const Home = async () => {
  redirect('/home')  // 备用重定向
}

export default Home
```

## 实施步骤

1. **修改重定向配置**
   ```bash
   # 编辑 web/next.config.js
   # 将 destination: '/apps' 改为 destination: '/home'
   ```

2. **重新构建应用**
   ```bash
   cd web
   npm run build
   ```

3. **重启服务**
   - 重新启动前端开发服务器或生产服务

## 影响范围

### 正面影响
- ✅ 用户访问根域名时直接进入首页 (`/home`)
- ✅ 符合一般网站的用户体验习惯
- ✅ `/home` 页面展示了平台的主要功能（智能体）

### 需要注意
- 🔄 如果有硬编码的链接指向根路径期望进入 `/apps`，需要更新
- 🔄 书签或外部链接可能需要用户重新设置
- 🔄 SEO 设置可能需要相应调整

## 测试验证

### 本地测试
1. 访问 `http://localhost:3000/` 
2. 确认自动重定向到 `http://localhost:3000/home`
3. 验证首页内容正确显示

### 生产环境测试
1. 访问生产域名根路径
2. 确认重定向行为正确
3. 检查页面加载性能

## 回滚方案

如果需要回滚到原来的配置：

```javascript
// 在 web/next.config.js 中
async redirects() {
  return [
    {
      source: '/',
      destination: '/apps',  // 恢复到 /apps
      permanent: false,
    },
  ]
},
```

然后重新构建和部署应用。

## 相关文件

- `web/next.config.js` - 主要修改文件
- `web/app/page.tsx` - 备用重定向页面
- `web/app/home/page.tsx` - 目标首页
- `web/app/home/layout.tsx` - 首页布局

## 技术说明

- **重定向类型**: 临时重定向 (302)，`permanent: false`
- **Next.js 版本**: 15.2.3
- **重定向机制**: Next.js 配置级重定向
- **SEO 友好**: 使用标准的 HTTP 重定向状态码 