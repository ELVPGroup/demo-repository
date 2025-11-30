import type { Prisma } from 'generated/prisma/client.js';
import prisma from '../db.js';

export class OrderDetailModel {
  async create(data: Prisma.OrderDetailCreateInput) {
    return prisma.orderDetail.create({ data });
  }
}

export const orderDetailModel = new OrderDetailModel();
