import prisma from '@/db.js';
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
    };
  }
  /**
   * 设置/更新配送区域
   */
  async upsert(payload: { merchantId: number; center: GeoPoint; radius: number }) {
    const [longitude, latitude] = payload.center;
    const area = await prisma.deliveryArea.upsert({
      where: { merchantId: payload.merchantId },
      create: { merchantId: payload.merchantId, longitude, latitude, radius: payload.radius },
      update: { longitude, latitude, radius: payload.radius },
    });
    return {
      merchantId: generateServiceId(payload.merchantId, ServiceKey.merchant),
      center: [area.longitude, area.latitude] as GeoPoint,
      radius: Number(area.radius),
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
