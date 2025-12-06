import Router from '@koa/router';
import { userOrderController } from '../../controllers/client/orderController.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';

const router = new Router({ prefix: '/api/client/orders' });

/**
 * POST /api/client/orders/list
 * 获取用户订单列表
 */
router.post('/list', authMiddleware, (ctx) => userOrderController.getOrderList(ctx));

/**
 * POST /api/client/orders
 * 创建订单
 */
router.post('/', authMiddleware, (ctx) => userOrderController.createOrder(ctx));

/**
 * GET /api/client/orders/detail/{orderId}
 * 获取用户订单详情
 */
router.get('/detail/:orderId', authMiddleware, (ctx) => userOrderController.getOrderDetail(ctx));

export default router;
