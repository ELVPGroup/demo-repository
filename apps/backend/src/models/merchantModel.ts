import prisma from '../db.js';

export class MerchantModel {
  async findByPhone(phone: string) {
    return prisma.merchant.findUnique({
      where: { phone },
    });
  }

  async create(payload: { name: string; phone: string; password: string }) {
    const { name, phone, password } = payload;
    return prisma.merchant.create({
      data: { name, phone, password },
    });
  }

  async findById(merchantId: number) {
    return prisma.merchant.findUnique({
      where: { merchantId },
    });
  }
}

export const merchantModel = new MerchantModel();
