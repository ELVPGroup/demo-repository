import Router from '@koa/router';
import { logisticsService } from '../services/logisticsService.js';
import type { GeoPoint, SimulationConfig } from '@evlp/shared/types/index.js';

const router = new Router({ prefix: '/simulations' });

/**
 * POST /simulations
 * 启动模拟
 * orderId 订单ID（数字）
 * origin 起点坐标 [lon, lat]
 * destination 终点坐标 [lon, lat]
 * options 可选配置：speedKmh, tickMs, variance
 */
router.post('/', async (ctx) => {
  const { orderId, origin, destination, options } = ctx.request.body as {
    orderId: number;
    origin: GeoPoint;
    destination: GeoPoint;
    options?: SimulationConfig;
  };

  if (!orderId || !origin || !destination) {
    ctx.throw(400, 'Missing required parameters');
  }

  await logisticsService.simulateShipment(orderId, origin, destination, options);
  ctx.body = { message: '模拟定位已启动', orderId };
});

router.delete('/:orderId', (ctx) => {
  const orderId = Number(ctx.params['orderId']);
  logisticsService.stopSimulation(orderId);
  ctx.body = { message: '模拟定位已停止', orderId };
});

router.get('/:orderId', (ctx) => {
  const orderId = Number(ctx.params['orderId']);
  const state = logisticsService.getShipmentState(orderId);
  if (!state) {
    ctx.throw(404, '此订单的模拟不存在');
  }
  ctx.body = state;
});

export default router;
