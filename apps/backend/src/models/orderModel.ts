import type { Prisma } from 'generated/prisma/client.js';
import prisma from '../db.js';

export class OrderModel {
  async findMany(params: Prisma.OrderFindManyArgs) {
    return prisma.order.findMany(params);
  }

  async create(data: Prisma.OrderCreateInput) {
    return prisma.order.create({ data });
  }

  async findById(orderId: number) {
    return prisma.order.findUnique({ where: { orderId } });
  }
}

export const orderModel = new OrderModel();
