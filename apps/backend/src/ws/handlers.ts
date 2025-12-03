import { WebSocket } from 'ws';
import { subscribeOrderShipping, unsubscribeOrderShipping } from './orderSubscriptions.js';
import { parseServiceId } from '@/utils/serverIdHandler.js';

export function handleMessage(ws: WebSocket, raw: string) {
  try {
    const msg = JSON.parse(raw);
    switch (msg.type) {
      case 'shipping_subscribe': {
        const idVal = msg.orderId;
        const numericId = typeof idVal === 'string' ? parseServiceId(idVal).id : Number(idVal);
        if (!numericId || Number.isNaN(numericId)) {
          ws.send(JSON.stringify({ error: 'Invalid orderId for subscription' }));
          break;
        }
        subscribeOrderShipping(ws, numericId);
        ws.send(JSON.stringify({ type: 'shipping_subscribed', orderId: numericId }));
        break;
      }

      case 'shipping_unsubscribe': {
        const idVal = msg.orderId;
        const numericId = typeof idVal === 'string' ? parseServiceId(idVal).id : Number(idVal);
        if (!numericId || Number.isNaN(numericId)) {
          ws.send(JSON.stringify({ error: 'Invalid orderId for unsubscribe' }));
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
