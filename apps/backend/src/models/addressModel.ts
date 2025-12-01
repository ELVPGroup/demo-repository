import type { Prisma } from 'generated/prisma/client.js';
import prisma from '../db.js';

export class AddressModel {
  async findMany(where: Prisma.AddressInfoWhereInput) {
    return prisma.addressInfo.findMany({ where });
  }

  async create(data: Prisma.AddressInfoCreateInput) {
    return prisma.addressInfo.create({ data });
  }

  async findById(addressInfoId: number) {
    return prisma.addressInfo.findUnique({
      where: { addressInfoId },
    });
  }

  async updateById(addressInfoId: number, data: Prisma.AddressInfoUpdateInput) {
    return prisma.addressInfo.update({
      where: { addressInfoId },
      data,
    });
  }

  async deleteById(addressInfoId: number) {
    return prisma.addressInfo.delete({
      where: { addressInfoId },
    });
  }
}

export const addressModel = new AddressModel();
