import type { Context, Next } from 'koa';
import { authService } from '../services/authService.js';

/**
 * JWT 认证中间件
 * 从请求头中提取 token 并验证
 */
export async function authMiddleware(ctx: Context, next: Next) {
  try {
    const authHeader = ctx.headers.authorization;
    console.log('authHeader', authHeader);

    if (!authHeader) {
      ctx.status = 401;
      ctx.body = {
        code: 401,
        _title: 'Unauthorized',
        _message: '缺少授权令牌',
      };
      return;
    }

    // 提取 Bearer token
    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      ctx.status = 401;
      ctx.body = {
        _title: 'Unauthorized',
        _message: '无效的授权令牌格式',
      };
      return;
    }

    // 验证 token
    const decoded = authService.verifyToken(token);
    console.log('decoded', decoded);
    // 将用户信息附加到 ctx 上
    ctx.state['user'] = decoded;
    console.log('authMiddlewareCtx', ctx.state);
    await next();
  } catch (error) {
    ctx.status = 401;
    ctx.body = {
      _title: 'Unauthorized',
      _message: error instanceof Error ? error.message : 'Token 验证失败',
    };
  }
}

/**
 * 可选的认证中间件
 * 如果提供了 token 则验证，否则继续
 */
export async function optionalAuthMiddleware(ctx: Context, next: Next) {
  try {
    const authHeader = ctx.headers.authorization;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      if (token) {
        const decoded = authService.verifyToken(token);
        ctx.state['user'] = decoded;
      }
    }

    await next();
  } catch {
    // 可选认证失败时继续，不返回错误
    await next();
  }
}
