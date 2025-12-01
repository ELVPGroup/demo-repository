import type Router from '@koa/router';
import authRouter from './auth.js';
import shippingRouter from './shipping.js';
import merchantOrderRouter from './merchant/orders.js';
import merchantShippingRouter from './merchant/shipping.js';
import userOrderRouter from './client/orders.js';

/**
 * 所有路由的聚合
 */
export const routers: Router[] = [
  authRouter,
  shippingRouter,
  merchantOrderRouter,
  merchantShippingRouter,
  userOrderRouter,
];

export default routers;
