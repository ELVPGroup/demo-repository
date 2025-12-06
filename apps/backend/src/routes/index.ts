import type Router from '@koa/router';
import authRouter from './auth.js';
import shippingRouter from './shipping.js';
import merchantOrderRouter from './merchant/orders.js';
import merchantShippingRouter from './merchant/shipping.js';
import merchantDeliveryAreaRouter from './merchant/deliveryArea.js';
import merchantLogisticsProviderRouter from './merchant/logisticsProvider.js';
import merchantProductsRouter from './merchant/products.js';
import userOrderRouter from './client/orders.js';
import clientProductsRouter from './client/products.js';
import uploadRouter from './upload.js';

/**
 * 所有路由的聚合
 */
export const routers: Router[] = [
  authRouter,
  shippingRouter,
  merchantOrderRouter,
  merchantShippingRouter,
  merchantDeliveryAreaRouter,
  merchantLogisticsProviderRouter,
  merchantProductsRouter,
  clientProductsRouter,
  userOrderRouter,
  uploadRouter,
];

export default routers;
