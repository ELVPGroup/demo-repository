import type { Context } from 'koa';
import { deliveryAreaService } from '@/services/deliveryAreaService.js';
import { extractRoleId } from '@/utils/roleHandler.js';

export class MerchantDeliveryAreaController {
  async get(ctx: Context) {
    try {
      const merchantId = (extractRoleId(ctx.state['user']) as { merchantId: number }).merchantId;
      const result = await deliveryAreaService.get(merchantId);
      ctx.status = 200;
      ctx.body = result
        ? {
            _data: { center: result.center, radius: result.radiusKm },
            _message: '获取配送范围成功',
          }
        : { _message: '商家未设置配送范围' };
    } catch (error) {
      ctx.status = 400;
      ctx.body = { _message: error instanceof Error ? error.message : '获取配送范围失败' };
    }
  }

  async upsert(ctx: Context) {
    try {
      const { center, radius } = ctx.request.body as { center?: [number, number]; radius?: number };
      if (!Array.isArray(center) || center.length !== 2) {
        ctx.status = 400;
        ctx.body = { _message: '中心坐标无效' };
        return;
      }
      const lon = Number(center[0]);
      const lat = Number(center[1]);
      const r = Number(radius) * 1000;
      if (Number.isNaN(lon) || Number.isNaN(lat) || Number.isNaN(r)) {
        ctx.status = 400;
        ctx.body = { _message: '坐标或半径无效' };
        return;
      }
      const merchantId = (extractRoleId(ctx.state['user']) as { merchantId: number }).merchantId;
      const result = await deliveryAreaService.upsert({
        merchantId,
        center: [lon, lat],
        radius: r,
      });
      ctx.status = 200;
      ctx.body = {
        _data: {
          center: result.center,
          radius: result.radiusKm,
        },
        _message: '设置配送范围成功',
      };
    } catch (error) {
      ctx.status = 400;
      ctx.body = { _message: error instanceof Error ? error.message : '设置配送范围失败' };
    }
  }

  async delete(ctx: Context) {
    try {
      const merchantId = (extractRoleId(ctx.state['user']) as { merchantId: number }).merchantId;
      await deliveryAreaService.delete(merchantId);
      ctx.status = 200;
      ctx.body = { _message: '删除配送范围成功' };
    } catch (error) {
      ctx.status = 400;
      ctx.body = { _message: error instanceof Error ? error.message : '删除配送范围失败' };
    }
  }
}

export const merchantDeliveryAreaController = new MerchantDeliveryAreaController();
