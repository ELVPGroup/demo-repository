# 电商物流配送可视化平台 monorepo 开发说明

## 项目结构

- 根目录：`pnpm-workspace.yaml` 管理工作空间
- 前端：`apps/frontend`，React + Vite + Tailwind，包名为 `@elvp/frontend`
- 后端：`apps/backend`，Koa + TypeScript，包名为 `@elvp/backend`

## 开发流程

### 前端

- 安装依赖：在根目录执行 `pnpm install`
- 启动开发服务器：`pnpm dev:web`（或 `cd apps/frontend && pnpm dev`）
- 构建产物：`pnpm build:web`（或 `cd apps/frontend && pnpm build`）
- 本地预览：`pnpm preview:web`（或 `cd apps/frontend && pnpm preview`）

#### 路由说明

项目使用 React Router v7 声明式路由进行路由管理，路由配置在 `apps/frontend/src/main.tsx` 中，目前已配置：

- `/`：首页，目前用于地图可视化的demo展示
- `/merchant`：商家端路由，默认展示仪表板页面
  - `/merchant/orders/:orderId`：订单详情页面，展示`orderId`订单的详细信息
  - `/merchant/delivery-management`：配送管理页面
- `/customer`：客户端路由，默认展示订单列表页面
  - `/customer/orders/:orderId`：订单详情页面，展示`orderId`订单的详细信息

**React Router 操作相关文档**：
- 路由配置：https://reactrouter.com/start/declarative/routing
- 路由跳转：https://reactrouter.com/start/declarative/navigating
- 参数使用：https://reactrouter.com/start/declarative/url-values

### 后端

- 安装依赖：在根目录执行 `pnpm install`
- 启动开发服务器：`pnpm dev:server`（或 `cd apps/backend && npm run dev`）

### Linter

- 运行检查：在根目录执行 `pnpm lint`
- 自动修复：`pnpm lint:fix`

### 格式化代码

- 统一格式化：`pnpm format`
- 校验是否有可格式化的文件：`pnpm format:check`

### Commit 规范

- 采用 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/v1.0.0/) 规范
- 示例：`feat: 实现用户登录功能`
  或使用带有修改范围的提交说明，如 `feat(auth): 实现用户登录功能`
- 如果提交说明的格式不符合规范，`husky` 钩子会拒绝提交，并提示错误信息
