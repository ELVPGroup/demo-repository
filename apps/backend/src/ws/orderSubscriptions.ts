import { generateServiceId, ServiceKey } from '@/utils/serverIdHandler.js';
import { WebSocket } from 'ws';

/**
 * 订单订阅管理
 * 维护 orderId -> Set<WebSocket> 的关系，供轨迹广播使用
 * 每个订单可以有多个订阅者（例如用户端、商家端同时订阅）
 */
const orderSubscriptions = new Map<number, Set<WebSocket>>();

/** 订阅指定订单的轨迹更新 */
export function subscribeOrderShipping(ws: WebSocket, orderId: number) {
  const set = orderSubscriptions.get(orderId) ?? new Set<WebSocket>();
  set.add(ws);
  orderSubscriptions.set(orderId, set);
}

/** 取消订阅指定订单的轨迹更新 */
export function unsubscribeOrderShipping(ws: WebSocket, orderId: number) {
  const set = orderSubscriptions.get(orderId);
  if (set) {
    set.delete(ws);
    if (set.size === 0) orderSubscriptions.delete(orderId);
  }
}

/** 广播订单轨迹更新给所有订阅者 */
export function broadcastOrderShipping(orderId: number, payload: unknown) {
  const set = orderSubscriptions.get(orderId);
  if (!set || set.size === 0) return;
  const msg = JSON.stringify({
    type: 'shipping_update',
    orderId: generateServiceId(orderId, ServiceKey.order),
    data: payload,
  });
  for (const ws of set) {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg);
  }
}

/** 获取订单订阅者数量（用于调试/监控） */
export function getOrderSubscriberCount(orderId: number) {
  return (orderSubscriptions.get(orderId) ?? new Set()).size;
}

/** 清理指定连接的所有订阅（连接关闭时调用） */
export function cleanupSubscriptionsFor(ws: WebSocket) {
  for (const [orderId, set] of orderSubscriptions.entries()) {
    if (set.has(ws)) {
      set.delete(ws);
      if (set.size === 0) orderSubscriptions.delete(orderId);
    }
  }
}
