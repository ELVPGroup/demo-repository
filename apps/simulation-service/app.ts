import 'dotenv/config';
import Koa from 'koa';
import { bodyParser } from '@koa/bodyparser';
import cors from '@koa/cors';
import koaLogger from 'koa-logger';
import dayjs from 'dayjs';
import {
  errorHandleMiddleware,
  notFoundMiddleware,
} from '@evlp/shared/middleware/errorHandleMiddleware.js';
import simulationRouter from './src/routes/simulation.js';

const app = new Koa();
const PORT = process.env['PORT'] || 9001;

// 中间件
// 跨域
app.use(cors());
// 解析请求体
app.use(bodyParser());
// 日志中间件
app.use(
  koaLogger((str) => {
    process.stdout.write(
      `[GPS Simulation server on PORT ${PORT}] ${dayjs(new Date()).format('YYYY-MM-DD HH:mm:ss')}${str}`
    );
  })
);

// 错误处理中间件
app.use(errorHandleMiddleware);

// 路由
app.use(simulationRouter.routes()).use(simulationRouter.allowedMethods());

// 健康检查路由
app.use(async (ctx, next) => {
  if (ctx.path === '/health') {
    ctx.status = 200;
    ctx.body = {
      title: 'success',
      message: 'GPS Simulation server health check passed',
      data: { status: 'ok' },
    };
    return;
  }
  await next();
});

// 404 处理
app.use(notFoundMiddleware);

app.listen(PORT, () => {
  console.log(
    `[GPS Simulation server on PORT ${PORT}] ${dayjs(new Date()).format('YYYY-MM-DD HH:mm:ss')} Server is running\n`
  );
});
