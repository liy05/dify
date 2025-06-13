# 用户管理页面样式优化

## 问题描述
用户反馈用户管理页面的字体和布局太大，需要参考其他页面进行调整。

## 参考标准
分析了以下页面的设计模式：
- **Apps页面** (`/apps`): 使用sticky顶部工具栏、px-12外边距、系统字体类
- **Datasets页面** (`/datasets`): 相似的布局结构和间距
- **整体设计系统**: 使用Dify设计系统的颜色和字体规范

## 优化内容

### 1. 整体布局结构
```typescript
// 修改前 - 简单的padding布局
<div className="p-6">

// 修改后 - 参考其他页面的布局结构
<div className="flex h-0 shrink-0 grow flex-col overflow-y-auto bg-background-body">
```

### 2. 顶部工具栏
```typescript
// 修改前 - 普通div布局
<div className="flex justify-between items-center mb-6">

// 修改后 - sticky顶部工具栏，与其他页面一致
<div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-y-2 bg-background-body px-12 pb-2 pt-4 leading-[56px]">
```

### 3. 标题和描述文字
```typescript
// 修改前 - 大字体
<h1 className="text-2xl font-bold text-gray-900 mb-2">用户管理</h1>
<p className="text-gray-600">管理当前工作空间的用户账户</p>

// 修改后 - 系统字体类
<h1 className="system-2xl-semibold text-text-primary">用户管理</h1>
<p className="system-sm-regular text-text-tertiary">管理当前工作空间的用户账户</p>
```

### 4. 搜索框优化
```typescript
// 修改前 - 自定义样式
<div className="relative">
  <RiSearchLine className="absolute left-3 top-1/2..." />
  <Input placeholder="搜索用户..." className="pl-10 w-64" />
</div>

// 修改后 - 使用组件内置图标功能
<Input
  showLeftIcon
  showClearIcon
  wrapperClassName="w-[200px]"
  placeholder="搜索用户..."
/>
```

### 5. 表格样式重构
```typescript
// 修改前 - 传统表格样式
<div className="bg-white rounded-lg shadow overflow-hidden">
<thead className="bg-gray-50">
<th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">

// 修改后 - Dify设计系统样式
<div className="mx-12 mt-2 mb-6 overflow-hidden rounded-xl border border-components-panel-border bg-components-panel-bg">
<thead className="border-b border-divider-subtle bg-background-default-wash">
<th className="px-4 py-3 system-xs-medium text-text-tertiary">
```

### 6. 表格内容样式
- **头像尺寸**: `h-10 w-10` → `h-8 w-8`
- **内边距**: `px-6 py-4` → `px-4 py-3`
- **字体大小**: `text-sm` → `system-sm-medium/system-xs-regular`
- **颜色系统**: `text-gray-900` → `text-text-primary`

### 7. 状态标签和按钮
```typescript
// 修改前 - 简单颜色
className="bg-blue-100 text-blue-800"

// 修改后 - 设计系统颜色
className="bg-util-colors-blue-blue-50 text-util-colors-blue-blue-600"
```

### 8. 分页组件简化
- 移除响应式复杂布局
- 统一使用小尺寸按钮 (`size="small"`)
- 使用系统字体类 (`system-sm-regular`)

## 设计系统对照

### 字体类映射
| 原样式 | 新样式 | 用途 |
|--------|--------|------|
| `text-2xl font-bold` | `system-2xl-semibold` | 页面标题 |
| `text-sm font-medium` | `system-sm-medium` | 用户名称 |
| `text-sm` | `system-xs-regular` | 邮箱、描述 |
| `text-xs font-medium` | `system-xs-medium` | 表头、标签 |

### 颜色类映射
| 原样式 | 新样式 | 用途 |
|--------|--------|------|
| `text-gray-900` | `text-text-primary` | 主要文字 |
| `text-gray-600` | `text-text-secondary` | 次要文字 |
| `text-gray-500` | `text-text-tertiary` | 辅助文字 |
| `bg-gray-50` | `bg-background-default-wash` | 背景色 |

### 间距和布局
- **外边距**: 统一使用 `px-12` (参考其他页面)
- **内边距**: 表格内容使用 `px-4 py-3`
- **圆角**: 使用 `rounded-xl` 替代 `rounded-lg`
- **分隔线**: 使用 `border-divider-subtle`

## 结果对比

### 修改前问题
- ❌ 字体过大，与其他页面不一致
- ❌ 间距过大，显得稀疏
- ❌ 颜色使用不规范
- ❌ 布局结构与设计系统不符

### 修改后效果
- ✅ 字体大小与其他页面保持一致
- ✅ 使用Dify设计系统的标准颜色
- ✅ 布局结构符合平台规范
- ✅ 整体视觉密度更合理
- ✅ 与Apps、Datasets页面风格统一

## 技术要点
1. **设计系统一致性**: 严格遵循Dify的设计系统规范
2. **布局参考**: 以Apps和Datasets页面为标准模板
3. **组件复用**: 使用平台通用组件和样式类
4. **响应式简化**: 优化复杂的响应式布局逻辑 