import type { Context } from 'koa';
import { productService } from '@/services/productService.js';

class ClientProductController {
  /**
   * 获取商品列表（客户端）
   * body: { limit?: number, offset?: number }
   */
  async list(ctx: Context): Promise<void> {
    try {
      const { limit, offset, productName } = ctx.request.body as {
        limit?: number;
        offset?: number;
        productName?: string;
      };
      const numericLimit = limit !== undefined ? Number(limit) : undefined;
      const numericOffset = offset !== undefined ? Number(offset) : undefined;
      if (numericLimit !== undefined && (!Number.isInteger(numericLimit) || numericLimit < 0)) {
        ctx.status = 400;
        ctx.body = { _message: 'limit 参数无效' };
        return;
      }
      if (numericOffset !== undefined && (!Number.isInteger(numericOffset) || numericOffset < 0)) {
        ctx.status = 400;
        ctx.body = { _message: 'offset 参数无效' };
        return;
      }

      const data = await productService.listClient({
        limit: numericLimit!,
        offset: numericOffset!,
        ...(productName ? { productName } : {}),
      });
      ctx.status = 200;
      ctx.body = { _data: data, _message: '获取商品列表成功' };
    } catch (error) {
      ctx.status = 400;
      ctx.body = { _message: error instanceof Error ? error.message : '获取商品列表失败' };
    }
  }
}

export const clientProductController = new ClientProductController();
