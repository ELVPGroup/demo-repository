import Router from '@koa/router';
import { authController } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = new Router({ prefix: '/api' });

/**
 * POST /api/register
 * 用户注册
 */
router.post('/register', (ctx) => authController.register(ctx));

/**
 * POST /api/login
 * 用户登录
 */
router.post('/login', (ctx) => authController.login(ctx));

/**
 * GET /api/profile
 * 获取当前用户信息（需要认证）
 */
router.get('/profile', authMiddleware, (ctx) => authController.getProfile(ctx));

export default router;
