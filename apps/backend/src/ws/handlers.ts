import { WebSocket } from 'ws';
import type { JwtPayload } from 'jsonwebtoken';
import { subscribeOrderShipping, unsubscribeOrderShipping } from './orderSubscriptions.js';
import { canAccessOrder } from './auth.js';
import { parseServiceId } from '@/utils/serverIdHandler.js';

export async function handleMessage(ws: WebSocket, raw: string, user: JwtPayload) {
  try {
    const msg = JSON.parse(raw);
    switch (msg.type) {
      case 'shipping_subscribe': {
        const idVal = msg.orderId;
        const numericId = typeof idVal === 'string' ? parseServiceId(idVal).id : Number(idVal);
        if (!numericId || Number.isNaN(numericId)) {
          ws.send(JSON.stringify({ error: '订单ID无效' }));
          break;
        }
        if (!(await canAccessOrder(user, numericId))) {
          ws.send(JSON.stringify({ error: '没有访问权限' }));
          break;
        }
        const state = await subscribeOrderShipping(ws, numericId);
        ws.send(
          JSON.stringify({
            type: 'shipping_subscribed',
            orderId: numericId,
            ...(state ? { data: state } : {}),
          })
        );
        break;
      }

      case 'shipping_unsubscribe': {
        const idVal = msg.orderId;
        const numericId = typeof idVal === 'string' ? parseServiceId(idVal).id : Number(idVal);
        if (!numericId || Number.isNaN(numericId)) {
          ws.send(JSON.stringify({ error: '订单ID无效' }));
          break;
        }
        if (!(await canAccessOrder(user, numericId))) {
          ws.send(JSON.stringify({ error: '没有操作权限' }));
          break;
        }
        unsubscribeOrderShipping(ws, numericId);
        ws.send(JSON.stringify({ type: 'shipping_unsubscribed', orderId: numericId }));
        break;
      }
    }
  } catch {
    ws.send(JSON.stringify({ error: 'Invalid JSON' }));
  }
}
