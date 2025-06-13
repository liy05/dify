# 用户管理页面访问受限问题修复

## 问题描述
用户管理页面显示"访问受限"，调试信息显示用户信息和工作空间信息都是空的：

```json
{
  "isCurrentWorkspaceOwner": false,
  "isCurrentWorkspaceManager": false,
  "currentWorkspace": {
    "id": "",
    "name": "",
    "plan": "",
    "status": "",
    "created_at": 0,
    "role": "normal",
    "providers": []
  },
  "hasAccess": false,
  "workspaceRole": "normal",
  "workspaceId": "",
  "workspaceName": "",
  "userId": "",
  "userName": "",
  "userEmail": ""
}
```

## 问题原因
用户管理页面放置在错误的位置：
- **错误位置**: `web/app/user-management/page.tsx`
- **正确位置**: `web/app/(commonLayout)/user-management/page.tsx`

用户管理页面没有被包含在 `AppContextProvider` 中，因此无法获取到：
- 用户认证信息
- 工作空间信息
- 权限状态

## 解决方案

### 1. 移动页面文件
```bash
# 创建正确的目录
mkdir "web\app\(commonLayout)\user-management"

# 移动页面文件
move "web\app\user-management\page.tsx" "web\app\(commonLayout)\user-management\page.tsx"

# 删除空的旧目录
rmdir "web\app\user-management"
```

### 2. 布局上下文
将页面移动到 `(commonLayout)` 后，它会自动获得以下上下文：
- `AppContextProvider`: 提供用户和工作空间信息
- `EventEmitterContextProvider`: 事件管理
- `ProviderContextProvider`: 服务提供者上下文
- `ModalContextProvider`: 模态框管理
- `HeaderWrapper` 和 `Header`: 页面头部

### 3. 权限检查优化
同时改进了权限检查逻辑：
```typescript
// 修改前
const isAdmin = currentWorkspace?.role === 'admin'
const hasAccess = isCurrentWorkspaceOwner || isAdmin

// 修改后  
const hasAccess = isCurrentWorkspaceManager
```

其中 `isCurrentWorkspaceManager` 包含了 owner 和 admin 角色：
```typescript
const isCurrentWorkspaceManager = useMemo(() => 
  ['owner', 'admin'].includes(currentWorkspace.role), 
  [currentWorkspace.role]
)
```

## 文件位置更改
- **旧路径**: `/user-management`
- **新路径**: `/user-management` (URL保持不变，但文件位置改变)

### 4. 修复API序列化错误
同时发现并修复了后端API的序列化错误：

**错误**:
```python
@marshal_with({"users": {"list": account_with_role_fields}, "total": {"Integer"}})
```

**修复**:
```python
@marshal_with({"users": fields.List(fields.Nested(account_with_role_fields)), "total": fields.Integer})
```

错误原因：Flask-RESTful的marshal_with装饰器需要正确的字段类型定义，不能使用字符串或嵌套字典。

### 5. 修复React Hooks顺序错误
移动页面位置后出现了React Hooks调用顺序错误：

**错误**: 
```
React has detected a change in the order of Hooks called by UserManagementPage
19. undefined → useContext
```

**问题原因**: `useSWR` Hook在条件性返回后调用，导致Hook调用顺序不一致

**修复方案**:
```typescript
// 修改前 (错误) - Hook在条件返回后调用
if (!hasAccess) {
  return <AccessDenied />
}
const { data, error, mutate } = useSWR(...)

// 修改后 (正确) - 所有Hook在条件返回前调用
const { data, error, mutate } = useSWR(
  hasAccess ? { page: currentPage, limit: pageSize, keyword } : null,
  fetchUsers,
  { revalidateOnFocus: false }
)
if (!hasAccess) {
  return <AccessDenied />
}
```

**核心原则**: 遵循React Hooks规则，所有Hook必须在组件顶层调用，不能在条件语句、循环或嵌套函数中调用。

## 验证
修复后，页面应该能够：
1. 正确获取用户信息
2. 正确获取工作空间信息  
3. 正确验证管理员/所有者权限
4. 正常显示用户管理界面
5. 正常加载用户列表数据

## 技术说明
Next.js App Router 的文件夹结构：
- `(commonLayout)`: 路由组，为其中的页面提供共享布局
- 不影响 URL 路径，但影响组件的上下文和布局
- 确保页面能够访问到认证和应用状态 