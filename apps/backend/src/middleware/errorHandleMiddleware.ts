import type { Context, Next } from 'koa';

export async function errorHandleMiddleware(ctx: Context, next: Next) {
  try {
    await next();
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      title: 'error',
      status: ctx.status,
      message: error instanceof Error ? error.message : '服务器内部错误',
    };
    console.error('Error:', error);
  }
}

export async function notFoundMiddleware(ctx: Context) {
  ctx.status = 404;
  ctx.body = {
    title: 'not found',
    status: ctx.status,
    message: '路由不存在',
  };
}
