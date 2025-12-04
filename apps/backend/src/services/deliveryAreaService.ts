import prisma from '@/db.js';
import { merchantModel } from '@/models/merchantModel.js';
import type { GeoPoint } from '@/types/index.js';
import { ServiceKey, generateServiceId } from '@/utils/serverIdHandler.js';

class DeliveryAreaService {
  /**
   * 获取配送区域
   */
  async get(merchantId: number) {
    const area = await prisma.deliveryArea.findUnique({ where: { merchantId } });
    if (!area) throw new Error('未配置配送区域');
    return {
      merchantId: generateServiceId(merchantId, ServiceKey.merchant),
      center: [area.longitude, area.latitude] as GeoPoint,
      radius: Number(area.radius),
      radiusKm: Number(area.radius) / 1000,
    };
  }
  /**
   * 设置/更新配送区域
   */
  async upsert(payload: { merchantId: number; center: GeoPoint; radius: number }) {
    console.info('Upsert delivery area', payload);
    const [longitude, latitude] = payload.center;

    const merchantExists = await merchantModel.findById(payload.merchantId);
    if (!merchantExists) {
      throw new Error('商家未注册，无法设置配送范围');
    }

    const area = await prisma.deliveryArea.upsert({
      where: { merchantId: payload.merchantId },
      create: { merchantId: payload.merchantId, longitude, latitude, radius: payload.radius },
      update: { longitude, latitude, radius: payload.radius },
    });
    return {
      merchantId: generateServiceId(payload.merchantId, ServiceKey.merchant),
      center: [area.longitude, area.latitude] as GeoPoint,
      radius: Number(area.radius),
      radiusKm: Number(area.radius) / 1000,
    };
  }
  /**
   * 删除配送区域
   */
  async delete(merchantId: number) {
    const exists = await prisma.deliveryArea.findUnique({ where: { merchantId } });
    if (exists) {
      await prisma.deliveryArea.delete({ where: { merchantId } });
    }
  }
}

export const deliveryAreaService = new DeliveryAreaService();
