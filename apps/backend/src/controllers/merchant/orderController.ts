import type { Context } from 'koa';
import { orderService } from '@/services/orderService.js';
import { addressModel } from '@/models/addressModel.js';
import { extractRoleId } from '@/utils/roleHandler.js';
import { type SortParams, type PaginationParams } from '@/types/index.js';
import type { OrderStatus } from '@/types/order.js';
import type { CreateOrderBody } from '@/types/order.js';
import { parseServiceId } from '@/utils/serverIdHandler.js';

type MerchantOrderListParams = {
  merchantId: number;
} & Partial<SortParams & PaginationParams>;

type FilterParams = {
  status?: OrderStatus;
  customerName?: string;
};

/**
 * 商家端订单控制器
 */
export class MerchantOrderController {
  /**
   * 获取商家端订单列表
   */
  async getOrderList(ctx: Context): Promise<void> {
    try {
      const { sort, sortBy, offset, limit, ...filterParams } = ctx.request.body as SortParams &
        PaginationParams &
        FilterParams;

      const params: MerchantOrderListParams = {
        ...(extractRoleId(ctx.state['user']) as { merchantId: number }),
        // 添加可选排序参数
        ...(sort && sortBy ? { sort, sortBy } : {}),
        // 添加可选分页参数
        ...(offset && limit ? { offset, limit } : {}),
        // 加入可选筛选参数
        ...filterParams,
      };

      const result = await orderService.getOrderList(params);

      ctx.status = 200;
      ctx.body = {
        _data: result,
        _message: '获取订单列表成功',
      };
    } catch (error) {
      ctx.status = 400;
      ctx.body = {
        _message: error instanceof Error ? error.message : '获取订单列表失败',
      };
    }
  }

  /**
   * 创建订单（商家端）
   */
  async create(ctx: Context): Promise<void> {
    try {
      const body = ctx.request.body as CreateOrderBody;

      const shippingFromId = Number(body.shippingFromId);
      if (!shippingFromId || Number.isNaN(shippingFromId)) {
        ctx.status = 400;
        ctx.body = { _message: '发货地址ID无效' };
        return;
      }

      const shippingTo = body.shippingTo;
      if (!shippingTo || !shippingTo.name || !shippingTo.phone || !shippingTo.address) {
        ctx.status = 400;
        ctx.body = { _message: '收货地址信息不完整' };
        return;
      }

      const products = body.products || [];
      if (!Array.isArray(products) || products.length === 0) {
        ctx.status = 400;
        ctx.body = { _message: '订单商品不能为空' };
        return;
      }

      const items = products
        .map((product) => ({
          productId: parseServiceId(product.productId).id,
          quantity: Number(product.amount || 0),
        }))
        .filter((i) => i.productId && !Number.isNaN(i.productId) && i.quantity > 0);

      if (items.length === 0) {
        ctx.status = 400;
        ctx.body = { _message: '订单商品数量无效' };
        return;
      }

      const userState = ctx.state['user'] as { side?: string; id?: number } | undefined;
      let userId: number | undefined;
      let merchantId: number | undefined;

      if (userState?.side === 'client') {
        userId = userState.id;
        const from = await addressModel.findById(shippingFromId);
        if (!from || !from.merchantId) {
          ctx.status = 400;
          ctx.body = { _message: '发货地址不存在或未关联商家' };
          return;
        }
        merchantId = from.merchantId;
      } else if (userState?.side === 'merchant') {
        merchantId = userState.id;
        const bodyUserId = parseServiceId(body.userId).id;
        if (!bodyUserId || Number.isNaN(bodyUserId)) {
          ctx.status = 400;
          ctx.body = { _message: '用户ID无效' };
          return;
        }
        userId = bodyUserId;
      } else {
        ctx.status = 401;
        ctx.body = { _message: '未授权' };
        return;
      }

      const [longitude, latitude] = shippingTo.location || [0, 0];

      const payloadBase = {
        userId: userId as number,
        merchantId: merchantId as number,
        shippingFromId,
        shippingTo: {
          name: shippingTo.name,
          phone: shippingTo.phone,
          address: shippingTo.address,
          longitude,
          latitude,
        },
        items,
      };

      const result = await orderService.createOrder(
        body.description ? { ...payloadBase, description: body.description } : payloadBase
      );

      ctx.status = 201;
      ctx.body = {
        _data: result,
        _message: '创建订单成功',
      };
    } catch (error) {
      ctx.status = 400;
      ctx.body = {
        _message: error instanceof Error ? error.message : '创建订单失败',
      };
    }
  }

  /**
   * 获取订单详情（商家端）
   */
  async getOrderDetail(ctx: Context): Promise<void> {
    try {
      const { orderId } = ctx.params as { orderId: string };

      const result = await orderService.getOrderDetail(parseServiceId(orderId).id);

      ctx.status = 200;
      ctx.body = {
        _data: result,
        _message: '获取订单详情成功',
      };
    } catch (error) {
      ctx.status = 400;
      ctx.body = {
        _message: error instanceof Error ? error.message : '获取订单详情失败',
      };
    }
  }
}

export const merchantOrderController = new MerchantOrderController();
