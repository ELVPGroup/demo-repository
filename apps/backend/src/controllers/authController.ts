import type { Context } from 'koa';
import { authService, type RequestSide } from '../services/authService.js';

/**
 * 认证控制器
 * 负责处理请求、验证参数、调用服务层、返回响应
 */
export class AuthController {
  /**
   * 用户注册
   */
  async register(ctx: Context): Promise<void> {
    try {
      const { name, phone, password } = ctx.request.body as {
        name?: string;
        phone?: string;
        password?: string;
      };

      const result = await authService.register({
        side: ctx.request.body.side as RequestSide,
        name: name as string,
        phone: phone as string,
        password: password as string,
      });

      ctx.status = 201;
      ctx.body = {
        ...result,
        _message: '注册成功',
      };
    } catch (error) {
      ctx.status = 400;
      ctx.body = {
        _message: error instanceof Error ? error.message : '注册失败',
      };
    }
  }

  /**
   * 用户登录
   */
  async login(ctx: Context): Promise<void> {
    try {
      const { phone, password } = ctx.request.body as {
        phone?: string;
        password?: string;
      };

      const result = await authService.login({
        side: ctx.request.body.side as RequestSide,
        phone: phone as string,
        password: password as string,
      });

      ctx.status = 200;
      ctx.body = {
        _message: '登录成功',
        ...result,
      };
    } catch (error) {
      ctx.status = 401;
      ctx.body = {
        _message: error instanceof Error ? error.message : '登录失败',
      };
    }
  }

  /**
   * 获取当前用户信息（需要认证）
   */
  async getProfile(ctx: Context): Promise<void> {
    try {
      const user = ctx.state['user'];

      if (!user) {
        ctx.status = 401;
        ctx.body = {
          _message: '未授权',
        };
        return;
      }

      const userInfo = await authService.getUserFromToken(
        ctx.headers.authorization?.replace('Bearer ', '') || ''
      );

      ctx.status = 200;
      ctx.body = {
        ...userInfo,
        _message: '获取用户信息成功',
      };
    } catch (error) {
      ctx.status = 400;
      ctx.body = {
        _message: error instanceof Error ? error.message : '获取用户信息失败',
      };
    }
  }
}

export const authController = new AuthController();
