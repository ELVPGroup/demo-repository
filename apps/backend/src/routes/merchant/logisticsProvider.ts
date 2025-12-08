import Router from '@koa/router';
import { merchantLogisticsProviderController } from '@/controllers/merchant/logisticsProviderController.js';
import { authMiddleware, optionalAuthMiddleware } from '@/middleware/authMiddleware.js';

const router = new Router({ prefix: '/api/merchant/logistics-provider' });

// 获取商家的物流供应商列表
// GET /api/merchant/logistics-provider
router.get('/', authMiddleware, (ctx) => merchantLogisticsProviderController.list(ctx));

// 获取全部物流供应商列表
// GET /api/merchant/logistics-provider/all
router.get('/all', optionalAuthMiddleware, (ctx) =>
  merchantLogisticsProviderController.listAll(ctx)
);

// 新增物流供应商
// POST /api/merchant/logistics-provider
router.post('/', authMiddleware, (ctx) => merchantLogisticsProviderController.create(ctx));

// 注册物流供应商
// POST /api/merchant/logistics-provider/register
router.post('/register', authMiddleware, (ctx) =>
  merchantLogisticsProviderController.register(ctx)
);

// 取消注册物流供应商
// POST /api/merchant/logistics-provider/unregister
router.post('/unregister', authMiddleware, (ctx) =>
  merchantLogisticsProviderController.unregister(ctx)
);

export default router;
