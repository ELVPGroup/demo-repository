import Router from '@koa/router';
import { userOrderController } from '../../controllers/client/orderController.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';

const router = new Router({ prefix: '/api/client/orders' });

/**
 * POST /api/client/orders
 * 获取用户订单列表
 */
router.post('/', authMiddleware, (ctx) => userOrderController.getOrderList(ctx));

export default router;
