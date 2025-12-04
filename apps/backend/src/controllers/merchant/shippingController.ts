import type { Context } from 'koa';
import { orderService } from '@/services/orderService.js';
import { extractRoleId } from '@/utils/roleHandler.js';
import { parseServiceId } from '@/utils/serverIdHandler.js';

export class MerchantShippingController {
  async send(ctx: Context): Promise<void> {
    try {
      const { orderId, logisticsId } = ctx.request.body as {
        orderId: string;
        logisticsId: string;
      };

      if (!orderId) {
        ctx.status = 400;
        ctx.body = { _message: '缺少订单ID' };
        return;
      }

      const merchantId = (extractRoleId(ctx.state['user']) as { merchantId: number }).merchantId;
      const numericOrderId = parseServiceId(orderId).id;

      if (!numericOrderId || Number.isNaN(numericOrderId)) {
        ctx.status = 400;
        ctx.body = { _message: '订单ID无效' };
        return;
      }

      if (!logisticsId) {
        ctx.status = 400;
        ctx.body = { _message: '请选择物流供应商' };
        return;
      }

      const result = await orderService.sendShipment(
        merchantId,
        numericOrderId,
        parseServiceId(logisticsId).id
      );

      ctx.status = 200;
      ctx.body = {
        _data: result,
        _message: '发货成功',
      };
    } catch (error) {
      ctx.status = 400;
      ctx.body = {
        _message: error instanceof Error ? error.message : '发货失败',
      };
    }
  }
}

export const merchantShippingController = new MerchantShippingController();
