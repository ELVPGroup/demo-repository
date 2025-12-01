import type { Prisma } from 'generated/prisma/client.js';
import prisma from '../db.js';

export class OrderItemModel {
  async createMany(data: Prisma.OrderItemCreateManyInput[]) {
    return prisma.orderItem.createMany({ data });
  }

  async create(data: Prisma.OrderItemCreateInput) {
    return prisma.orderItem.create({ data });
  }
}

export const orderItemModel = new OrderItemModel();
