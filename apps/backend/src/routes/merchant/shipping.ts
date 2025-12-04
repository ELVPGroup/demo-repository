import Router from '@koa/router';
import { merchantShippingController } from '@/controllers/merchant/shippingController.js';
import { authMiddleware } from '@/middleware/authMiddleware.js';

const router = new Router({ prefix: '/api/merchant/shipping' });

router.post('/send', authMiddleware, (ctx) => merchantShippingController.send(ctx));

export default router;
