import type { Context } from 'koa';
import { orderService } from '@/services/orderService.js';
import { extractRoleId } from '@/utils/roleHandler.js';
import { type SortParams, type PaginationParams } from '@/types/index.js';
import type { ClientOrderListFilterParams, ClientOrderListParams } from '@/types/order.js';
import { parseServiceId } from '@/utils/serverIdHandler.js';
import { getTruthyKeyValues } from '@/utils/general.js';

/**
 * 用户端订单控制器
 */
export class UserOrderController {
  /**
   * 获取用户端订单列表
   */
  async getOrderList(ctx: Context): Promise<void> {
    try {
      const { sort, sortBy, offset, limit, orderId, ...filterParams } = ctx.request
        .body as SortParams & PaginationParams & ClientOrderListFilterParams;

      const params: ClientOrderListParams = {
        ...(extractRoleId(ctx.state['user']) as { userId: number }),
        // 添加可选排序参数
        ...(sort && sortBy ? { sort, sortBy } : {}),
        // 添加可选分页参数
        ...(offset !== undefined && limit !== undefined ? { offset, limit } : {}),
        // 加入可选筛选参数
        ...(orderId !== undefined ? { orderId: parseServiceId(orderId).id } : {}),
        ...getTruthyKeyValues(filterParams),
      };

      const result = await orderService.getOrderList(params);

      ctx.status = 200;
      ctx.body = {
        _data: result,
        _message: '获取订单列表成功',
      };
    } catch (error) {
      ctx.status = 400;
      ctx.body = {
        _message: error instanceof Error ? error.message : '获取订单列表失败',
      };
    }
  }

  /**
   * 获取订单详情（用户端）
   */
  async getOrderDetail(ctx: Context): Promise<void> {
    try {
      const { orderId } = ctx.params as { orderId: string };

      const result = await orderService.getOrderDetail(parseServiceId(orderId).id);

      ctx.status = 200;
      ctx.body = {
        _data: result,
        _message: '获取订单详情成功',
      };
    } catch (error) {
      ctx.status = 400;
      ctx.body = {
        _message: error instanceof Error ? error.message : '获取订单详情失败',
      };
    }
  }

  /**
   * 客户端创建订单
   * body:
   * {
   *   shippingAddress: { name: string, phone: string, address: string },
   *   products: [{ productId: string, merchantId: string, amount: number }]
   * }
   */
  async createOrder(ctx: Context): Promise<void> {
    try {
      const userId = (extractRoleId(ctx.state['user']) as { userId: number }).userId;
      const body = ctx.request.body as {
        shippingAddress?: { name?: string; phone?: string; address?: string };
        products?: Array<{ productId?: string; merchantId?: string; amount?: number }>;
      };

      const shippingAddress = body.shippingAddress || {};
      const products = body.products || [];

      const name = String(shippingAddress.name || '').trim();
      const phone = String(shippingAddress.phone || '').trim();
      const address = String(shippingAddress.address || '').trim();
      if (!name || !phone || !address) {
        ctx.status = 400;
        ctx.body = { _message: '收货信息不完整' };
        return;
      }
      if (!Array.isArray(products) || products.length === 0) {
        ctx.status = 400;
        ctx.body = { _message: '商品列表不能为空' };
        return;
      }

      const normalized = products.map((product) => ({
        productId: parseServiceId(product.productId!).id,
        merchantId: parseServiceId(product.merchantId!).id,
        amount: Number(product.amount ?? 1),
      }));
      if (normalized.some((p) => !Number.isInteger(p.productId) || p.productId <= 0)) {
        ctx.status = 400;
        ctx.body = { _message: '商品ID无效' };
        return;
      }
      if (normalized.some((p) => !Number.isInteger(p.merchantId) || p.merchantId <= 0)) {
        ctx.status = 400;
        ctx.body = { _message: '商家ID无效' };
        return;
      }
      if (normalized.some((p) => !Number.isInteger(p.amount) || p.amount <= 0)) {
        ctx.status = 400;
        ctx.body = { _message: '商品数量无效' };
        return;
      }

      const result = await orderService.createOrdersByClient({
        userId,
        shippingTo: { name, phone, address },
        products: normalized,
      });

      ctx.status = 201;
      ctx.body = { _data: result, _message: '订单创建成功，待商家确认' };
    } catch (error) {
      ctx.status = 400;
      ctx.body = { _message: error instanceof Error ? error.message : '创建订单失败' };
    }
  }
}

export const userOrderController = new UserOrderController();
