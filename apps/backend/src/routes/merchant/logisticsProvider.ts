import Router from '@koa/router';
import { merchantLogisticsProviderController } from '@/controllers/merchant/logisticsProviderController.js';
import { authMiddleware } from '@/middleware/authMiddleware.js';

const router = new Router({ prefix: '/api/merchant/logistics-provider' });

router.get('/', authMiddleware, (ctx) => merchantLogisticsProviderController.list(ctx));
router.post('/', authMiddleware, (ctx) => merchantLogisticsProviderController.create(ctx));

export default router;
