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
 * POST /api/merchant/orders
 * 创建订单（商家端）
 */
router.post('/', authMiddleware, (ctx) => merchantOrderController.create(ctx));

export default router;
