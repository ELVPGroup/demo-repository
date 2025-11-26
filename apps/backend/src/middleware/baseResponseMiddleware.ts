import type { Context, Next } from 'koa';

/**
 * 基础响应包装中间件
 * 为所有 json 响应统一加上 { title, status, message, data? }
 *
 * 对于成功响应，将 _message、_title、_data  转换为成功响应的 message、title、data
 * 其余字段原样保留。适合数组等直接将返回值作为 data 的情况
 *
 * 对于失败响应，将 _message 转换为失败响应的 message
 */
export async function baseResponseMiddleware(ctx: Context, next: Next) {
  await next();

  // 如果已经是格式化的响应或没有 body，跳过处理
  if (!ctx.body || typeof ctx.body !== 'object') {
    return;
  }

  const payload = ctx.body as Record<string, unknown>;

  // 检查响应状态码
  const isSuccess = ctx.status >= 200 && ctx.status < 300;

  if (isSuccess) {
    // 成功消息处理
    const { _message, _title, _data, ...rest } = payload;

    ctx.body = {
      title: typeof _title === 'string' ? _title : 'success',
      status: ctx.status,
      message: typeof _message === 'string' ? _message : 'OK',
      data: _data ? _data : rest,
    };
  } else {
    // 错误消息处理
    const { _message, _title } = payload;
    ctx.body = {
      title: typeof _title === 'string' ? _title : 'error',
      status: ctx.status,
      message: typeof _message === 'string' ? _message : 'An error occurred',
    };
  }
}

export default baseResponseMiddleware;
