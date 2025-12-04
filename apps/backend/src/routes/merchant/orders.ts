import Router from '@koa/router';
import { merchantOrderController } from '../../controllers/merchant/orderController.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';

const router = new Router({ prefix: '/api/merchant/orders' });

/**
 * POST /api/merchant/orders/list
 * 获取商家订单列表
 */
router.post('/list', authMiddleware, (ctx) => merchantOrderController.getOrderList(ctx));

/**
 * POST /api/merchant/orders/delivery-area
 * 获取配送区域订单列表
 */
router.post('/delivery-area', authMiddleware, (ctx) =>
  merchantOrderController.getDeliveryAreaOrders(ctx)
);

/**
 * POST /api/merchant/orders
 * 创建订单（商家端）
 */
router.post('/', authMiddleware, (ctx) => merchantOrderController.create(ctx));

/**
 * GET /api/merchant/orders/detail/{orderId}
 * 获取订单详情（商家端）
 */
router.get('/detail/:orderId', authMiddleware, (ctx) =>
  merchantOrderController.getOrderDetail(ctx)
);

/**
 * PUT /api/merchant/orders/{orderId}
 * 更新订单状态（商家端）
 */
router.put('/:orderId', authMiddleware, (ctx) => merchantOrderController.updateOrderInfo(ctx));

export default router;
