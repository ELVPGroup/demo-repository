import type Router from '@koa/router';
import authRouter from './auth.js';
import shippingRouter from './shipping.js';

/**
 * 所有路由的聚合
 */
export const routers: Router[] = [authRouter, shippingRouter];

export default routers;
