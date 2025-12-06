import Router from '@koa/router';
import { clientProductController } from '@/controllers/client/productController.js';
import { optionalAuthMiddleware } from '@/middleware/authMiddleware.js';

const router = new Router({ prefix: '/api/client/products' });

// POST /api/client/products/list 获取商品列表，可不登录使用
router.post('/list', optionalAuthMiddleware, (ctx) => clientProductController.list(ctx));

export default router;
