import type {
  MerchantOrderListParams,
  ClientOrderListParams,
  MerchantOrderListFilterParams,
  ClientOrderListFilterParams,
} from '../types/order.js';
import prisma from '../db.js';

export class OrderService {
  /**
   * 获取用户/商家订单列表
   */
  async getOrderList(
    payload:
      | (MerchantOrderListParams & Partial<MerchantOrderListFilterParams>)
      | (ClientOrderListParams & Partial<ClientOrderListFilterParams>)
  ) {
    const where: Record<string, unknown> = {};
    if ('merchantId' in payload && payload.merchantId !== undefined) {
      // 商家订单列表
      where['merchantId'] = payload.merchantId;
      if ('customerName' in payload && payload.customerName) {
        where['customerName'] = { contains: payload.customerName, mode: 'insensitive' };
      }
    } else if ('userId' in payload && payload.userId !== undefined) {
      // 客户订单列表
      where['userId'] = payload.userId;
      if ('productName' in payload && payload.productName) {
        where['productName'] = { contains: payload.productName, mode: 'insensitive' };
      }
      if ('orderId' in payload && payload.orderId !== undefined) {
        where['orderId'] = payload.orderId;
      }
    } else {
      throw new Error('必须提供商家ID或用户ID');
    }
    // 通用的订单状态筛选
    if ('status' in payload && payload.status !== undefined) {
      where['status'] = payload.status;
    }

    return prisma.order.findMany({
      where,
      ...(payload.offset !== undefined ? { skip: payload.offset } : {}),
      ...(payload.limit !== undefined ? { take: payload.limit } : {}),
      ...(payload.sort && payload.sortBy ? { orderBy: { [payload.sortBy]: payload.sort } } : {}),
    });
  }
}

export const orderService = new OrderService();
