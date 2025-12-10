import type { Prisma } from 'generated/prisma/client.js';
import prisma from '../db.js';

export class OrderModel {
  async findMany(params: Prisma.OrderFindManyArgs) {
    return prisma.order.findMany(params);
  }

  async create(data: Prisma.OrderCreateInput) {
    return prisma.order.create({ data });
  }

  async update(orderId: number, data: Prisma.OrderUpdateInput) {
    return prisma.order.update({
      where: { orderId },
      data,
    });
  }

  async count(params: Prisma.OrderCountArgs) {
    return prisma.order.count(params);
  }

  // 查询订单详情需要的Payload
  private findByIdDetailPayload = {
    include: {
      orderItems: {
        include: {
          product: true,
        },
      },
      detail: {
        include: {
          addressFrom: true,
          addressTo: true,
          timelineItems: true,
        },
      },
      user: { select: { name: true } },
      merchant: { select: { name: true } },
    },
  };

  async findById(
    orderId: number,
    withDetail?: boolean
  ): Promise<Prisma.OrderGetPayload<typeof this.findByIdDetailPayload> | null>;
  async findById(orderId: number, withDetail: boolean = false) {
    return prisma.order.findUnique({
      where: { orderId },
      ...(withDetail ? this.findByIdDetailPayload : {}),
    });
  }
}

export const orderModel = new OrderModel();
