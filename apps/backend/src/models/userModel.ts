import prisma from '../db.js';

export class UserModel {
  async findByPhone(phone: string) {
    return prisma.user.findUnique({
      where: { phone },
    });
  }

  async create(payload: { name: string; phone: string; password: string }) {
    const { name, phone, password } = payload;
    return prisma.user.create({
      data: { name, phone, password },
    });
  }

  async findById(userId: number) {
    return prisma.user.findUnique({
      where: { userId },
    });
  }
  // 根据用户名模糊查询用户
  async findByName(name: string) {
    return prisma.user.findMany({
      where: { name: { contains: name, mode: 'insensitive' } },
      select: { userId: true },
    });
  }
}

export const userModel = new UserModel();
