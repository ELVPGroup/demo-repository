import jwt from 'jsonwebtoken';
import { orderModel } from '@/models/orderModel.js';

/** 检查用户是否有访问订单操作的权限 */
export async function canAccessOrder(user: jwt.JwtPayload, orderId: number) {
  const wsUser = user as { side?: string; id?: number };
  if (!wsUser || !wsUser.side) return false;
  const order = await orderModel.findById(orderId);
  if (!order) return false;
  if (wsUser.side === 'merchant') return order.merchantId === wsUser.id;
  if (wsUser.side === 'client') return order.userId === wsUser.id;
  return false;
}
