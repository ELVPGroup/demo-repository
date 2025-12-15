# 电商物流配送可视化平台 ELVP 前后端单仓（Monorepo）

这是一个包含前端与后端的单仓项目，用于电商物流可视化与订单追踪。实现商家备货->用户下单->商家确认并模拟发货->模拟货物运输->用户实时追踪->确认收货的核心闭环。仓库采用 pnpm Workspace 管理。

API文档：http://s8qihd9ypc.apifox.cn/

体验地址：http://8.134.211.162/

## 项目结构

```
├── apps/
│   ├── backend/            # Koa + Prisma + PostgreSQL + WebSocket
│   ├── frontend/           # React + TypeScript + Vite
│   └── simulation-service/ # Koa + TypeScript (物流轨迹模拟服务)
├── packages/
│   └── shared/             # 公共类型定义、工具函数与中间件
├── docs/                   # 开发与数据库文档
├── package.json        # 根级脚本与工具配置
├── pnpm-workspace.yaml # Workspace 配置
└── README.md
```

前端技术栈：React 19、TypeScript、Vite、Ant Design、Tailwind
后端技术栈：Koa、Prisma、PostgreSQL、JWT、WebSocket
模拟轨迹服务技术栈：Koa、TypeScript

## 环境要求

- Node.js 22+
- pnpm（`pnpm@10.11.0`）
- PostgreSQL（本地开发建议 15+）

## 安装依赖

```bash
pnpm install
```

## 后端配置与数据库初始化

1. 在 `apps/backend` 目录下创建环境文件：
   - 复制 `apps/backend/.env.example` 为 `.env`
   - 根据实际情况修改 `DATABASE_URL`、`JWT_SECRET`、`PORT`、`AMAP_API_KEY`

2. 生成 Prisma Client：
   ```bash
   pnpm --filter @elvp/backend prisma generate
   ```

3. 初始化/迁移数据库（本地开发）：
   ```bash
   pnpm --filter @elvp/backend prisma migrate dev
   ```
   如在部署环境使用既有迁移，可改用：
   ```bash
   pnpm --filter @elvp/backend prisma migrate deploy
   ```

4. 在 `apps/simulation-service` 目录下配置环境文件：
   - 复制 `apps/simulation-service/.env.example` 为 `.env`
   - 配置 `PORT` (默认 9001)、`AMAP_API_KEY` 和 `BACKEND_URL`

后端默认监听端口 `3000`（可在 `.env` 中通过 `PORT` 配置）。健康检查接口：`GET /health`。
模拟轨迹服务默认监听端口 `9001`（可在 `.env` 中通过 `PORT` 配置）。健康检查接口：`GET /health`。

## 启动开发环境

- 启动后端（HTTP + WebSocket）：
  ```bash
  pnpm dev:server
  ```
  启动后访问 `http://localhost:3000`，WebSocket 默认 `ws://localhost:3000/ws`。

- 启动前端（Vite Dev Server）：
  ```bash
  pnpm dev:web
  ```
  默认访问 `http://localhost:5173`。

- 启动模拟轨迹服务：
  ```bash
  pnpm --filter @elvp/simulation-service dev
  ```

## 前端 API/WS 地址说明

- REST API 基础地址当前在 `apps/frontend/src/utils/axios.ts` 中修改。本地开发修改为：
  ```ts
  // apps/frontend/src/utils/axios.ts
  const BASE_URL = 'http://localhost:3000/api';
  ```

- WebSocket 基础地址定义在 `apps/frontend/src/config/index.ts`（行 1）：
  ```ts
  export const BASE_WS_URL = 'ws://localhost:3000/ws';
  ```

后端所有 REST 路由均以 `/api` 为前缀，例如：
- 认证：`POST /api/login`、`GET /api/profile`
- 商家订单：`POST /api/merchant/orders/list`、`GET /api/merchant/orders/detail/:orderId`

## 构建与预览

- 构建全部服务：
  ```bash
  pnpm build:all
  ```

- 构建后端并运行：
  ```bash
  pnpm build:server
  pnpm serve
  ```

- 构建前端并预览：
  ```bash
  pnpm build:web
  pnpm preview:web
  ```

## 质量保障与提交规范

- 代码检查：`pnpm lint`、自动修复：`pnpm lint:fix`
- 格式化：`pnpm format`、检查：`pnpm format:check`
- Husky 与 Commitlint 已配置，建议遵循约定式提交规范

## Git 仓库信息

本项目关联到以下 GitHub 仓库：
- 主要仓库：https://github.com/ELVPGroup/demo-repository.git

## 注意事项

- 需要可用的 PostgreSQL 数据库并正确配置连接字符串
- 如果在本地开发，请将前端的 `BASE_URL` 指向本地后端地址
- 访问 GitHub 需确保网络代理设置正确
- 提交代码前请运行检查与格式化脚本
