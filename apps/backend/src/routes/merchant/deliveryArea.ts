import Router from '@koa/router';
import { merchantDeliveryAreaController } from '@/controllers/merchant/deliveryAreaController.js';
import { authMiddleware } from '@/middleware/authMiddleware.js';

const router = new Router({ prefix: '/api/merchant/delivery-area' });

router.get('/', authMiddleware, (ctx) => merchantDeliveryAreaController.get(ctx));
router.post('/', authMiddleware, (ctx) => merchantDeliveryAreaController.upsert(ctx));
router.delete('/', authMiddleware, (ctx) => merchantDeliveryAreaController.delete(ctx));

export default router;

