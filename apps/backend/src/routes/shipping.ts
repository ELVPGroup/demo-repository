import Router from '@koa/router';
import { addressController } from '../controllers/addressController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = new Router({ prefix: '/api/shipping' });

/**
 * GET /api/shipping/list
 * 获取地址簿列表
 */
router.get('/list', authMiddleware, (ctx) => addressController.getAddressList(ctx));

/**
 * POST /api/shipping/list
 * 添加地址
 */
router.post('/list', authMiddleware, (ctx) => addressController.createAddress(ctx));

/**
 * PUT /api/shipping/list/:addressInfoId
 * 更新地址
 */
router.put('/list', authMiddleware, (ctx) => addressController.updateAddress(ctx));

/**
 * DELETE /api/shipping/list/:addressInfoId
 * 删除地址
 */
router.delete('/list/:addressInfoId', authMiddleware, (ctx) =>
  addressController.deleteAddress(ctx)
);

export default router;
