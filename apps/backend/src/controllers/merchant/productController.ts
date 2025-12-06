import type { Context } from 'koa';
import { productService } from '@/services/productService.js';
import { extractRoleId } from '@/utils/roleHandler.js';
import { parseServiceId } from '@/utils/serverIdHandler.js';

class MerchantProductController {
  /**
   * 获取此商家的商品列表
   */
  async list(ctx: Context) {
    try {
      const merchantId = (extractRoleId(ctx.state['user']) as { merchantId: number }).merchantId;
      const data = await productService.list(merchantId);
      ctx.status = 200;
      ctx.body = { _data: data, _message: '获取商品列表成功' };
    } catch (error) {
      ctx.status = 400;
      ctx.body = { _message: error instanceof Error ? error.message : '获取商品列表失败' };
    }
  }

  /**
   * 新增或更新此商家的商品
   */
  async upsert(ctx: Context) {
    try {
      const merchantId = (extractRoleId(ctx.state['user']) as { merchantId: number }).merchantId;
      const { productId, name, description, price, amount, imageUrl } = ctx.request.body as {
        productId?: string;
        name?: string;
        description?: string;
        price?: number;
        amount?: number;
        imageUrl?: string;
      };

      if (!name || typeof name !== 'string' || !name.trim()) {
        ctx.status = 400;
        ctx.body = { _message: '商品名称无效' };
        return;
      }
      const numericPrice = Number(price);
      if (!Number.isFinite(numericPrice) || numericPrice < 0) {
        ctx.status = 400;
        ctx.body = { _message: '商品价格无效' };
        return;
      }
      const integerAmount = Number(amount);
      if (!Number.isInteger(integerAmount) || integerAmount < 0) {
        ctx.status = 400;
        ctx.body = { _message: '库存数量无效' };
        return;
      }

      const result = await productService.upsert({
        merchantId,
        productId: productId ? parseServiceId(productId).id : undefined,
        name: name.trim(),
        description: description ?? '',
        price: numericPrice,
        amount: integerAmount,
        imageUrl: imageUrl ?? '',
      });

      ctx.status = productId ? 200 : 201;
      ctx.body = { _data: result, _message: productId ? '更新商品成功' : '新增商品成功' };
    } catch (error) {
      ctx.status = 400;
      ctx.body = { _message: error instanceof Error ? error.message : '新增或更新商品失败' };
    }
  }

  /**
   * 删除此商家的商品
   * @param ctx Koa 上下文
   */
  async delete(ctx: Context) {
    try {
      const merchantId = (extractRoleId(ctx.state['user']) as { merchantId: number }).merchantId;
      const productIdParam = ctx.params['productId'];
      const productId = parseServiceId(productIdParam!).id;
      if (!Number.isInteger(productId) || productId <= 0) {
        ctx.status = 400;
        ctx.body = { _message: '商品ID无效' };
        return;
      }

      const result = await productService.delete(merchantId, productId);
      ctx.status = 200;
      ctx.body = { _data: result, _message: '删除商品成功' };
    } catch (error) {
      ctx.status = 400;
      ctx.body = { _message: error instanceof Error ? error.message : '删除商品失败' };
    }
  }
}

export const merchantProductController = new MerchantProductController();
