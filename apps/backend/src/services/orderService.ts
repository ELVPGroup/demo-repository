import type {
  MerchantOrderListParams,
  ClientOrderListParams,
  MerchantOrderListFilterParams,
  ClientOrderListFilterParams,
  CreateOrderPayload,
  UpdateOrderServicePayload,
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
import { getDictName, orderStatusDict, shippingStatusDict } from '@/utils/dicts.js';
import { getDefinedKeyValues } from '@/utils/general.js';

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

  /**
   * 商家创建订单
   */
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

  /**
   * 商家更新订单状态
   */
  async updateOrderInfo(
    merchantId: number,
    orderId: number,
    updatePayload: UpdateOrderServicePayload
  ) {
    const order = await orderModel.findById(orderId);
    if (!order) {
      throw new Error('订单不存在');
    }
    if (order.merchantId !== merchantId) {
      throw new Error('没有权限更新该订单');
    }
    // 更新订单事务
    await prisma.$transaction(async (tx) => {
      const changes: string[] = []; // 记录变更

      if (updatePayload.status) {
        // 更新订单状态
        await tx.order.update({ where: { orderId }, data: { status: updatePayload.status } });
        changes.push(`订单状态更新为: ${getDictName(updatePayload.status, orderStatusDict)}`);
      }

      if (updatePayload.shippingInfo) {
        // 更新收货地址信息
        const { addressInfoId, name, phone, address } = updatePayload.shippingInfo;
        const addressUpdate: Record<string, string> = {};
        // 将非空字段添加到更新对象
        Object.assign(addressUpdate, getDefinedKeyValues({ name, phone, address }));
        if (Object.keys(addressUpdate).length > 0) {
          await tx.addressInfo.update({ where: { addressInfoId }, data: addressUpdate });
          changes.push('收货地址更新');
        }
      }

      if (updatePayload.products && updatePayload.products.length > 0) {
        // 更新订单商品信息
        for (const product of updatePayload.products) {
          const { productId, amount, name, description, price } = product;
          if (amount !== undefined) {
            await tx.orderItem.upsert({
              where: { orderId_productId: { orderId, productId } },
              update: { quantity: amount },
              create: { orderId, productId, quantity: amount },
            });
          }

          const productUpdate: Record<string, unknown> = {};
          // 将非空字段添加到更新对象
          Object.assign(productUpdate, getDefinedKeyValues({ name, description, price }));
          if (Object.keys(productUpdate).length > 0) {
            await tx.product.update({ where: { productId }, data: productUpdate });
          }
        }
      }

      if (changes.length > 0) {
        await tx.timelineItem.create({
          data: {
            orderDetail: { connect: { orderId } },
            // 物流状态描述更新
            ...(changes.length > 0 ? { description: changes.join('; ') } : {}),
          },
        });
      }
    });

    return this.getOrderDetail(orderId);
  }

  /**
   * 获取订单详情
   */
  async getOrderDetail(orderId: number) {
    const order = await orderModel.findById(orderId, true);
    if (!order) {
      throw new Error('订单不存在');
    }

    const from = order.detail?.addressFrom;
    const to = order.detail?.addressTo;
    const timeline = order.detail?.timelineItems ?? [];
    const latest = timeline.length > 0 ? timeline[timeline.length - 1] : undefined;
    // 计算订单商品总数和总金额
    const amount = order.orderItems.reduce(
      (acc: number, it: { quantity: number }) => acc + it.quantity,
      0
    );
    const totalPrice = order.orderItems.reduce(
      (acc, it) => acc + it.quantity * (it.product.price as unknown as number),
      0
    );

    return {
      orderId: generateServiceId(order.orderId, ServiceKey.order),
      merchantId: generateServiceId(order.merchantId!, ServiceKey.merchant),
      merchantName: order.merchant?.name ?? '',
      userId: generateServiceId(order.userId!, ServiceKey.client),
      userName: order.user?.name ?? '',
      status: getDictName(order.status, orderStatusDict),
      createdAt: order.createdAt,
      shippingFrom: from
        ? {
            addressInfoId: generateServiceId(from.addressInfoId, ServiceKey.addressInfo),
            name: from.name,
            phone: from.phone,
            address: from.address,
            location: [from.longitude, from.latitude],
          }
        : undefined,
      shippingTo: to
        ? {
            addressInfoId: generateServiceId(to.addressInfoId, ServiceKey.addressInfo),
            name: to.name,
            phone: to.phone,
            address: to.address,
            location: [to.longitude, to.latitude],
          }
        : undefined,
      products: order.orderItems.map((orderItem) => ({
        productId: generateServiceId(orderItem.productId, ServiceKey.product),
        name: orderItem.product.name,
        price: Number(orderItem.product.price),
        amount: orderItem.quantity,
        description: orderItem.product.description ?? '',
      })),
      amount,
      totalPrice,
      shippingStatus: latest ? getDictName(latest.shippingStatus, shippingStatusDict) : undefined,
      timeline: timeline.map((timelineItem) => ({
        shippingStatus: getDictName(timelineItem.shippingStatus, shippingStatusDict),
        time: timelineItem.time,
        description: timelineItem.description ?? '',
      })),
    };
  }
}

export const orderService = new OrderService();
