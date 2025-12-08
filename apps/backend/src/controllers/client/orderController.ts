import type { Context } from 'koa';
import { orderService } from '@/services/orderService.js';
import { extractRoleId } from '@/utils/roleHandler.js';
import { type SortParams, type PaginationParams } from '@/types/index.js';
import type { ClientOrderListFilterParams, ClientOrderListParams } from '@/types/order.js';
import { generateServiceId, parseServiceId, ServiceKey } from '@/utils/serverIdHandler.js';
import { getTruthyKeyValues } from '@evlp/shared/utils/general.js';

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
   */
  async createOrder(ctx: Context): Promise<void> {
    try {
      const userId = (extractRoleId(ctx.state['user']) as { userId: number }).userId;
      const body = ctx.request.body as {
        addressInfoId?: string;
        merchantGroups?: Array<{
          merchantId: string;
          items: Array<{ productId: string; quantity: number }>;
        }>;
      };

      if (!body.addressInfoId) {
        ctx.status = 400;
        ctx.body = { _message: '请选择收货地址' };
        return;
      }
      if (!Array.isArray(body.merchantGroups) || body.merchantGroups.length === 0) {
        ctx.status = 400;
        ctx.body = { _message: '商品列表不能为空' };
        return;
      }

      const normalizedGroups = body.merchantGroups.map((group) => {
        const merchantId = parseServiceId(group.merchantId).id;
        if (!Number.isInteger(merchantId) || merchantId <= 0) {
          throw new Error('商家ID无效');
        }
        const items = (group.items || []).map((item) => {
          const productId = parseServiceId(item.productId).id;
          const quantity = Number(item.quantity ?? 0);
          if (!Number.isInteger(productId) || productId <= 0) {
            throw new Error('商品ID无效');
          }
          if (!Number.isInteger(quantity) || quantity <= 0) {
            throw new Error('商品数量无效');
          }
          return { productId, quantity };
        });

        if (items.length === 0) {
          throw new Error('每个商家的订单项不能为空');
        }
        return { merchantId, items };
      });

      const result = await orderService.createOrdersByClient({
        userId,
        addressInfoId: parseServiceId(body.addressInfoId).id,
        merchantGroups: normalizedGroups,
      });

      const responseData = {
        succeeded: result.createdOrderIds,
        failed: result.failedGroups.map((g) => ({
          merchantId: generateServiceId(g.merchantId, ServiceKey.merchant),
          items: g.items.map((i) => ({
            productId: generateServiceId(i.productId, ServiceKey.product),
            quantity: i.quantity,
          })),
          reason: g.reason,
        })),
      };

      ctx.status = 201;
      ctx.body = {
        _data: responseData,
        _message:
          responseData.failed.length > 0
            ? `订单处理完成，有 ${responseData.failed.length} 个商家创建失败`
            : '订单创建成功，待商家确认',
      };
    } catch (error) {
      ctx.status = 400;
      ctx.body = { _message: error instanceof Error ? error.message : '创建订单失败' };
    }
  }
}

export const userOrderController = new UserOrderController();
