import Router from '@koa/router';
import { merchantOrderController } from '../../controllers/merchant/orderController.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';

const router = new Router({ prefix: '/api/merchant/orders' });

/**
 * POST /api/merchant/orders/list
 * 获取商家订单列表
 */
router.post('/list', authMiddleware, (ctx) => merchantOrderController.getOrderList(ctx));

export default router;
