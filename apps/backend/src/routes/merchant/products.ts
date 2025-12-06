import Router from '@koa/router';
import { merchantProductController } from '@/controllers/merchant/productController.js';
import { authMiddleware } from '@/middleware/authMiddleware.js';

const router = new Router({ prefix: '/api/merchant/products' });

// 获取商品列表
router.get('/', authMiddleware, (ctx) => merchantProductController.list(ctx));
// 新增/更新商品（依据是否传入 productId）
router.post('/', authMiddleware, (ctx) => merchantProductController.upsert(ctx));
// 删除商品
router.del('/:productId', authMiddleware, (ctx) => merchantProductController.delete(ctx));

export default router;
