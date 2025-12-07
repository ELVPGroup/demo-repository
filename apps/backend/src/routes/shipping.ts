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

/**
 * GET /api/shipping/default
 * 获取当前商家/用户的默认地址
 */
router.get('/default', authMiddleware, (ctx) => addressController.getDefaultAddress(ctx));

/**
 * POST /api/shipping/default
 * 设置当前商家/用户的默认地址
 */
router.post('/default', authMiddleware, (ctx) => addressController.setDefaultAddress(ctx));

export default router;
