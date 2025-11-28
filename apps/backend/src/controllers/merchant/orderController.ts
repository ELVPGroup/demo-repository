import type { Context } from 'koa';
import { orderService } from '@/services/orderService.js';
import { extractRoleId } from '@/utils/roleHandler.js';
import { type SortParams, type PaginationParams } from '@/types/index.js';
import type { OrderStatus } from '@/../generated/prisma/enums.js';

type MerchantOrderListParams = {
  merchantId: number;
} & Partial<SortParams & PaginationParams>;

type FilterParams = {
  status?: OrderStatus;
  customerName?: string;
};

/**
 * 商家端订单控制器
 */
export class MerchantOrderController {
  /**
   * 获取商家端订单列表
   */
  async getOrderList(ctx: Context): Promise<void> {
    try {
      const { sort, sortBy, offset, limit, ...filterParams } = ctx.request.body as SortParams &
        PaginationParams &
        FilterParams;

      const params: MerchantOrderListParams = {
        ...(extractRoleId(ctx.state['user']) as { merchantId: number }),
        // 添加可选排序参数
        ...(sort && sortBy ? { sort, sortBy } : {}),
        // 添加可选分页参数
        ...(offset && limit ? { offset, limit } : {}),
        // 加入可选筛选参数
        ...filterParams,
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
}

export const merchantOrderController = new MerchantOrderController();
