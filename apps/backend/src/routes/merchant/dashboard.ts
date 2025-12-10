import Router from '@koa/router';
import { merchantDashboardController } from '@/controllers/merchant/dashboardController.js';
import { authMiddleware } from '@/middleware/authMiddleware.js';

const router = new Router({
  prefix: '/api/merchant/dashboard',
});


// GET /api/merchant/dashboard
// 获取商家仪表盘数据
router.get('/',authMiddleware, (ctx) => merchantDashboardController.getDashboardData(ctx));

export default router;
