import 'dotenv/config';
import Koa from 'koa';
import { bodyParser } from '@koa/bodyparser';
import cors from '@koa/cors';
import koaLogger from 'koa-logger';
import { routers } from './src/routes/index.js';
import {
  errorHandleMiddleware,
  notFoundMiddleware,
} from './src/middleware/errorHandleMiddleware.js';
import { baseResponseMiddleware } from './src/middleware/baseResponseMiddleware.js';

const app = new Koa();
const PORT = process.env['PORT'] || 3000;

// 中间件
// 跨域
app.use(cors());
// 解析请求体
app.use(bodyParser());
// 日志中间件
app.use(koaLogger());

// 基础响应包装中间件
app.use(baseResponseMiddleware);

// 错误处理中间件
app.use(errorHandleMiddleware);

// 健康检查路由
app.use(async (ctx, next) => {
  if (ctx.path === '/health') {
    ctx.status = 200;
    ctx.body = {
      title: 'success',
      status: 200,
      message: 'Health check passed',
      data: { status: 'ok' },
    };
    return;
  }
  await next();
});

// 注册所有路由
routers.forEach((router) => {
  app.use(router.routes());
  app.use(router.allowedMethods());
});

// 404 处理
app.use(notFoundMiddleware);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
