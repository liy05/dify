# Dify Web Frontend

## 🆕 最新功能更新

### 新增首页功能 (Home Page)
- **默认路由更改**: 访问根路径 `/` 现在会自动重定向到 `/home` 页面
- **登录后重定向**: 所有登录方式成功后都会重定向到 `/home` 页面：
  - 邮箱密码登录
  - 邮箱验证码登录 
  - 邀请链接激活
  - OAuth/SSO登录（通过查询参数处理）
- **全新首页设计**: 提供了一个现代化的欢迎界面，包含：
  - 欢迎信息和产品介绍
  - 快速操作卡片（Apps、Datasets、Explore、Tools）
  - 快速开始指南
- **完整顶部导航**: 保留了完整的Header组件，包括：
  - 用户头像和下拉菜单
  - 工作空间选择器
  - 环境切换
  - 所有原有的导航功能

### 文件结构
```
web/app/
├── home/
│   ├── layout.tsx    # Home页面布局
│   └── page.tsx      # Home页面主内容
├── page.tsx          # 根页面（重定向到/home）
└── ...
```

---

# Dify Web Client

这是一个使用 [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app) 创建的 [Next.js](https://nextjs.org/) 项目。

## 开始使用

### 通过源代码运行

在启动 Web 前端服务之前，请确保以下环境已经准备就绪：
- [Node.js](https://nodejs.org) >= v22.11.x
- [pnpm](https://pnpm.io) v10.x

首先，安装依赖：

```bash
pnpm install
```

然后，配置环境变量。在当前目录创建一个名为 `.env.local` 的文件，并从 `.env.example` 复制内容。根据你的需求修改这些环境变量的值：

```bash
cp .env.example .env.local
```

```
# 生产环境发布时，将此值改为 PRODUCTION
NEXT_PUBLIC_DEPLOY_ENV=DEVELOPMENT
# 部署版本，SELF_HOSTED
NEXT_PUBLIC_EDITION=SELF_HOSTED
# 控制台应用的基础 URL，如果控制台域名与 API 或 Web 应用域名不同，则指向 WEB 服务的控制台基础 URL
# 示例：http://cloud.dify.ai/console/api
NEXT_PUBLIC_API_PREFIX=http://localhost:5001/console/api
# Web 应用的 URL，如果 Web 应用域名与控制台或 API 域名不同，则指向 WEB 服务的 Web 应用基础 URL
# 示例：http://udify.app/api
NEXT_PUBLIC_PUBLIC_API_PREFIX=http://localhost:5001/api

# SENTRY
NEXT_PUBLIC_SENTRY_DSN=
```

最后，运行开发服务器：

```bash
pnpm run dev
```

使用浏览器打开 [http://localhost:3000](http://localhost:3000) 查看结果。

你可以开始编辑 `app` 文件夹下的文件。当你编辑文件时，页面会自动更新。

## 部署

### 在服务器上部署

首先，为生产环境构建应用：

```bash
pnpm run build
```

然后，启动服务器：

```bash
pnpm run start
```

如果你想自定义主机和端口：

```bash
pnpm run start --port=3001 --host=0.0.0.0
```

如果你想自定义 PM2 启动的实例数量，可以在 `docker-compose.yaml` 或 `Dockerfile` 中配置 `PM2_INSTANCES`。

## Storybook

本项目使用 [Storybook](https://storybook.js.org/) 进行 UI 组件开发。

要启动 storybook 服务器，运行：

```bash
pnpm storybook
```

使用浏览器打开 [http://localhost:6006](http://localhost:6006) 查看结果。

## 代码检查

如果你的 IDE 是 VSCode，将 `web/.vscode/settings.example.json` 重命名为 `web/.vscode/settings.json` 以启用代码检查设置。

## 测试

我们开始使用 [Jest](https://jestjs.io/) 和 [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) 进行单元测试。

你可以在要测试的文件旁边创建一个带有 `.spec` 后缀的测试文件。例如，如果你想测试一个名为 `util.ts` 的文件，测试文件名应该是 `util.spec.ts`。

运行测试：

```bash
pnpm run test
```

如果你不熟悉如何编写测试，这里有一些代码可以参考：
* [classnames.spec.ts](./utils/classnames.spec.ts)
* [index.spec.tsx](./app/components/base/button/index.spec.tsx)

## 文档

访问 <https://docs.dify.ai/getting-started/readme> 查看完整文档。

## 社区

你可以在 [Discord 社区](https://discord.gg/5AEfbxcd9k) 找到 Dify 社区，在那里你可以提问、分享想法和展示你的项目。
