import type {
  MerchantOrderListParams,
  ClientOrderListParams,
  MerchantOrderListFilterParams,
  ClientOrderListFilterParams,
  CreateOrderPayload,
} from '../types/order.js';
import { orderModel } from '../models/orderModel.js';
import { userModel } from '../models/userModel.js';
import type { OrderStatus } from '../types/order.js';
type OrderWithItems = {
  orderId: number;
  status: OrderStatus;
  createdAt: Date;
  userId: number | null;
  merchantId: number | null;
  user: { name: string } | null;
  merchant: { name: string } | null;
  orderItems: Array<{ quantity: number; product: { price: number } }>;
};
import prisma from '../db.js';
import { addressModel } from '@/models/addressModel.js';
import { productModel } from '@/models/productModel.js';
import { generateServiceId } from '@/utils/serverIdHandler.js';
import { ServiceKey } from '@/utils/serverIdHandler.js';
import { getDictName, orderStatusDict } from '@/utils/dicts.js';

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
        // 通过orderItems查询产品名称
        where['orderItems'] = {
          some: {
            product: {
              name: { contains: payload.productName, mode: 'insensitive' },
            },
          },
        };
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
    const orders = (await orderModel.findMany({
      where,
      ...(payload.offset !== undefined ? { skip: payload.offset } : {}),
      ...(payload.limit !== undefined ? { take: payload.limit } : {}),
      ...(payload.sort && payload.sortBy ? { orderBy: { [payload.sortBy]: payload.sort } } : {}),
      include: {
        orderItems: {
          include: {
            product: {
              select: { price: true },
            },
          },
        },
        user: { select: { name: true } },
        merchant: { select: { name: true } },
      },
    })) as OrderWithItems[];

    return orders.map((order) => {
      const amount = order.orderItems.reduce(
        (acc: number, it: { quantity: number }) => acc + it.quantity,
        0
      );
      const totalPrice = order.orderItems.reduce(
        (acc: number, it: { quantity: number; product: { price: number } }) =>
          acc + it.quantity * it.product.price,
        0
      );
      return {
        orderId: generateServiceId(order.orderId, ServiceKey.order),
        status: getDictName<OrderStatus>(order.status, orderStatusDict),
        createdAt: order.createdAt,
        userId: generateServiceId(order.userId!, ServiceKey.client),
        merchantId: generateServiceId(order.merchantId!, ServiceKey.merchant),
        amount,
        totalPrice,
        ...('merchantId' in payload && payload.merchantId !== undefined
          ? { userName: order.user?.name ?? '' }
          : {}),
        ...('userId' in payload && payload.userId !== undefined
          ? { merchantName: order.merchant?.name ?? '' }
          : {}),
      };
    });
  }

  async createOrder(payload: CreateOrderPayload) {
    const { userId, merchantId, shippingFromId, shippingTo, items, description } = payload;

    const addressFrom = await addressModel.findById(shippingFromId);
    if (!addressFrom) {
      throw new Error('发货地址不存在');
    }
    if (addressFrom.merchantId !== merchantId) {
      throw new Error('没有权限使用该发货地址');
    }
    if (!items || items.length === 0) {
      throw new Error('订单项不能为空');
    }
    for (const item of items) {
      const product = await productModel.findById(item.productId);
      if (!product) {
        throw new Error(`商品不存在: ${item.productId}`);
      }
    }
    // 使用事务保证数据正确建立
    const result = await prisma.$transaction(async (tx) => {
      const to = await tx.addressInfo.create({
        data: {
          name: shippingTo.name,
          phone: shippingTo.phone,
          address: shippingTo.address,
          longitude: shippingTo.longitude ?? 0,
          latitude: shippingTo.latitude ?? 0,
          userId,
        },
      });

      const order = await tx.order.create({
        data: {
          userId,
          merchantId,
        },
      });

      const detail = await tx.orderDetail.create({
        data: {
          order: { connect: { orderId: order.orderId } },
          addressFrom: { connect: { addressInfoId: addressFrom.addressInfoId } },
          addressTo: { connect: { addressInfoId: to.addressInfoId } },
        },
      });

      await tx.timelineItem.create({
        data: {
          orderDetail: { connect: { orderId: detail.orderId } },
          description: description ?? '订单创建',
        },
      });

      await tx.orderItem.createMany({
        data: items.map((item) => ({
          orderId: order.orderId,
          productId: item.productId,
          quantity: item.quantity,
        })),
      });

      return { orderId: generateServiceId(order.orderId, ServiceKey.order) };
    });

    return result;
  }
}

export const orderService = new OrderService();
