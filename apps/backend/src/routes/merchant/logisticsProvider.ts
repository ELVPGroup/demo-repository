import Router from '@koa/router';
import { merchantLogisticsProviderController } from '@/controllers/merchant/logisticsProviderController.js';
import { authMiddleware, optionalAuthMiddleware } from '@/middleware/authMiddleware.js';

const router = new Router({ prefix: '/api/merchant/logistics-provider' });

// 获取商家的物流供应商列表
router.get('/', authMiddleware, (ctx) => merchantLogisticsProviderController.list(ctx));

// 获取全部物流供应商列表
router.get('/all', optionalAuthMiddleware, (ctx) =>
  merchantLogisticsProviderController.listAll(ctx)
);

// 新增物流供应商
router.post('/', authMiddleware, (ctx) => merchantLogisticsProviderController.create(ctx));

// 注册物流供应商
router.post('/register', authMiddleware, (ctx) =>
  merchantLogisticsProviderController.register(ctx)
);

export default router;
