import prisma from '@/db.js';
import { generateServiceId } from '@/utils/serverIdHandler.js';
import { ServiceKey } from '@/utils/serverIdHandler.js';

class LogisticsProviderService {
  /**
   * 获取此商家的物流供应商列表
   */
  async list(merchantId: number) {
    const items = await prisma.logisticsProvider.findMany({
      where: { merchants: { some: { merchantId } } },
      select: { logisticsId: true, name: true, speed: true },
      orderBy: { logisticsId: 'asc' },
    });
    return items.map((item) => ({
      logisticsId: generateServiceId(item.logisticsId, ServiceKey.logisticsProvider),
      name: item.name,
      speed: item.speed,
    }));
  }

  /**
   * 创建此商家的物流供应商
   */
  async create(payload: { merchantId: number; name: string; speed: number }) {
    const existing = await prisma.logisticsProvider.findUnique({
      where: { name: payload.name },
      include: { merchants: { select: { merchantId: true } } },
    });

    if (existing) {
      const connected = existing.merchants.some((m) => m.merchantId === payload.merchantId);
      const updated = await prisma.logisticsProvider.update({
        where: { logisticsId: existing.logisticsId },
        data: {
          speed: payload.speed,
          ...(connected ? {} : { merchants: { connect: { merchantId: payload.merchantId } } }),
        },
        select: { logisticsId: true, name: true, speed: true },
      });
      return {
        logisticsId: generateServiceId(updated.logisticsId, ServiceKey.logisticsProvider),
      };
    }

    const created = await prisma.logisticsProvider.create({
      data: {
        name: payload.name,
        speed: payload.speed,
        merchants: { connect: { merchantId: payload.merchantId } },
      },
      select: { logisticsId: true, name: true, speed: true },
    });
    return {
      logisticsId: generateServiceId(created.logisticsId, ServiceKey.logisticsProvider),
    };
  }
  /**
   * 获取全部物流供应商列表
   * @param merchantId 如果提供了 merchantId，则标记该商家是否已注册
   */
  async listAll(merchantId?: number) {
    const items = await prisma.logisticsProvider.findMany({
      include: {
        merchants: merchantId
          ? {
              where: { merchantId },
              select: { merchantId: true },
            }
          : false,
      },
      orderBy: { logisticsId: 'asc' },
    });

    return items.map((item) => ({
      logisticsId: generateServiceId(item.logisticsId, ServiceKey.logisticsProvider),
      name: item.name,
      speed: item.speed,
      isRegistered: merchantId ? item.merchants.length > 0 : undefined,
    }));
  }

  /**
   * 商家注册现有物流供应商
   */
  async register(payload: { merchantId: number; logisticsId: number }) {
    const provider = await prisma.logisticsProvider.findUnique({
      where: { logisticsId: payload.logisticsId },
      include: { merchants: { where: { merchantId: payload.merchantId } } },
    });

    if (!provider) {
      throw new Error('物流供应商不存在');
    }

    if (provider.merchants.length > 0) {
      // 已经注册过，直接返回成功
      return {
        logisticsId: generateServiceId(provider.logisticsId, ServiceKey.logisticsProvider),
      };
    }

    await prisma.logisticsProvider.update({
      where: { logisticsId: payload.logisticsId },
      data: {
        merchants: { connect: { merchantId: payload.merchantId } },
      },
    });

    return {
      logisticsId: generateServiceId(provider.logisticsId, ServiceKey.logisticsProvider),
    };
  }
}

export const logisticsProviderService = new LogisticsProviderService();
