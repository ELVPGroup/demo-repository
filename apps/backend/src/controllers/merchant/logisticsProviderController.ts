import type { Context } from 'koa';
import { logisticsProviderService } from '@/services/logisticsProviderService.js';
import { extractRoleId } from '@/utils/roleHandler.js';

class MerchantLogisticsProviderController {
  /**
   * 获取此商家的物流供应商列表
   */
  async list(ctx: Context): Promise<void> {
    try {
      const merchantId = (extractRoleId(ctx.state['user']) as { merchantId: number }).merchantId;
      const data = await logisticsProviderService.list(merchantId);
      ctx.status = 200;
      ctx.body = { _data: data, _message: '获取物流供应商列表成功' };
    } catch (error) {
      ctx.status = 400;
      ctx.body = { _message: error instanceof Error ? error.message : '获取物流供应商列表失败' };
    }
  }

  /**
   * 创建此商家的物流供应商
   */
  async create(ctx: Context): Promise<void> {
    try {
      const { name, speed } = ctx.request.body as { name?: string; speed?: number };
      const merchantId = (extractRoleId(ctx.state['user']) as { merchantId: number }).merchantId;

      if (!name || typeof name !== 'string' || !name.trim()) {
        ctx.status = 400;
        ctx.body = { _message: '物流供应商名称无效' };
        return;
      }
      const numericSpeed = Number(speed);
      if (!Number.isFinite(numericSpeed) || numericSpeed <= 0) {
        ctx.status = 400;
        ctx.body = { _message: '平均速度无效' };
        return;
      }

      const result = await logisticsProviderService.create({
        merchantId,
        name: name.trim(),
        speed: numericSpeed,
      });

      ctx.status = 201;
      ctx.body = { _data: result, _message: '新增物流供应商成功' };
    } catch (error) {
      ctx.status = 400;
      ctx.body = { _message: error instanceof Error ? error.message : '新增物流供应商失败' };
    }
  }
}

export const merchantLogisticsProviderController = new MerchantLogisticsProviderController();
