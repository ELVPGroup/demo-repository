import type { Prisma } from 'generated/prisma/client.js';
import prisma from '../db.js';

export class OrderModel {
  async findMany(params: Prisma.OrderFindManyArgs) {
    return prisma.order.findMany(params);
  }
}

export const orderModel = new OrderModel();
