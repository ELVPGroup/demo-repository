import 'dotenv/config';
import Koa from 'koa';
import { bodyParser } from '@koa/bodyparser';
import cors from '@koa/cors';
import koaLogger from 'koa-logger';
import serve from 'koa-static';
import { routers } from './src/routes/index.js';
import {
  errorHandleMiddleware,
  notFoundMiddleware,
} from './src/middleware/errorHandleMiddleware.js';
import { baseResponseMiddleware } from './src/middleware/baseResponseMiddleware.js';
import { getStaticRoot } from '@/utils/config.js';
import dayjs from 'dayjs';

const app = new Koa();

// 中间件
// 跨域
app.use(cors());
// 解析请求体
app.use(bodyParser());
// 日志中间件
app.use(
  koaLogger((str) => {
    process.stdout.write(`${dayjs(new Date()).format('YYYY-MM-DD HH:mm:ss')}${str}`);
  })
);

// 基础响应包装中间件
app.use(baseResponseMiddleware);

// 错误处理中间件
app.use(errorHandleMiddleware);

// 健康检查路由
app.use(async (ctx, next) => {
  if (ctx.path === '/health') {
    ctx.status = 200;
    ctx.body = {
      _title: 'success',
      _message: 'Health check passed',
      _data: { status: 'ok' },
    };
    return;
  }
  await next();
});

// 静态资源服务
const staticRoot = getStaticRoot();
const staticMiddleware = serve(staticRoot);
app.use(async (ctx, next) => {
  if (ctx.path.startsWith('/static')) {
    // 去掉前缀后交给 koa-static 处理
    ctx.path = ctx.path.replace(/^\/static/, '') || '/';
    await staticMiddleware(ctx, next);
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

export default app;
