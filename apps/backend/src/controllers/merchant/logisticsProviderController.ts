import type { Context } from 'koa';
import { logisticsProviderService } from '@/services/logisticsProviderService.js';
import { extractRoleId } from '@/utils/roleHandler.js';
import { parseServiceId } from '@/utils/serverIdHandler.js';

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
  /**
   * 获取全部物流供应商列表（可选鉴权）
   */
  async listAll(ctx: Context): Promise<void> {
    try {
      let merchantId: number | undefined;
      if (ctx.state['user']) {
        try {
          const role = extractRoleId(ctx.state['user']);
          if ('merchantId' in role) {
            merchantId = role.merchantId;
          }
        } catch {
          // 忽略提取角色失败，视为未登录
        }
      }

      const data = await logisticsProviderService.listAll(merchantId);
      ctx.status = 200;
      ctx.body = { _data: data, _message: '获取物流供应商列表成功' };
    } catch (error) {
      ctx.status = 400;
      ctx.body = { _message: error instanceof Error ? error.message : '获取物流供应商列表失败' };
    }
  }

  /**
   * 商家注册现有物流供应商
   */
  async register(ctx: Context): Promise<void> {
    try {
      const { logisticsId } = ctx.request.body as { logisticsId?: string };
      const merchantId = (extractRoleId(ctx.state['user']) as { merchantId: number }).merchantId;

      if (!logisticsId) {
        ctx.status = 400;
        ctx.body = { _message: '物流供应商ID无效' };
        return;
      }

      const numericLogisticsId = parseServiceId(logisticsId).id;
      if (!Number.isInteger(numericLogisticsId) || numericLogisticsId <= 0) {
        ctx.status = 400;
        ctx.body = { _message: '物流供应商ID格式错误' };
        return;
      }

      const result = await logisticsProviderService.register({
        merchantId,
        logisticsId: numericLogisticsId,
      });

      ctx.status = 200;
      ctx.body = { _data: result, _message: '注册物流供应商成功' };
    } catch (error) {
      ctx.status = 400;
      ctx.body = { _message: error instanceof Error ? error.message : '注册物流供应商失败' };
    }
  }

  /**
   * 商家取消注册物流供应商
   */
  async unregister(ctx: Context): Promise<void> {
    try {
      const { logisticsId } = ctx.request.body as { logisticsId?: string };
      const merchantId = (extractRoleId(ctx.state['user']) as { merchantId: number }).merchantId;

      if (!logisticsId) {
        ctx.status = 400;
        ctx.body = { _message: '物流供应商ID无效' };
        return;
      }

      const numericLogisticsId = parseServiceId(logisticsId).id;
      if (!Number.isInteger(numericLogisticsId) || numericLogisticsId <= 0) {
        ctx.status = 400;
        ctx.body = { _message: '物流供应商ID格式错误' };
        return;
      }

      const result = await logisticsProviderService.unregister({
        merchantId,
        logisticsId: numericLogisticsId,
      });

      ctx.status = 200;
      ctx.body = { _data: result, _message: '取消注册物流供应商成功' };
    } catch (error) {
      ctx.status = 400;
      ctx.body = { _message: error instanceof Error ? error.message : '取消注册物流供应商失败' };
    }
  }
}

export const merchantLogisticsProviderController = new MerchantLogisticsProviderController();
