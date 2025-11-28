import type {
  MerchantOrderListParams,
  ClientOrderListParams,
  MerchantOrderListFilterParams,
  ClientOrderListFilterParams,
} from '../types/order.js';
import { orderModel } from '../models/orderModel.js';
import { userModel } from '../models/userModel.js';
import { OrderStatus } from 'generated/prisma/enums.js';

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
        const users = await userModel.findByName(payload.customerName);
        if (users.length > 0) {
          where['userId'] = { in: users.map((user) => user.userId) };
        }
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
      where['status'] = OrderStatus[payload.status];
    }
    return orderModel.findMany({
      where,
      ...(payload.offset !== undefined ? { skip: payload.offset } : {}),
      ...(payload.limit !== undefined ? { take: payload.limit } : {}),
      ...(payload.sort && payload.sortBy ? { orderBy: { [payload.sortBy]: payload.sort } } : {}),
    });
  }
}

export const orderService = new OrderService();
