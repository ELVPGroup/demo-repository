import { logisticsService } from '@/services/logisticsService.js';
import {
  generateRealtimeLocationFromState,
  type RealtimeLocation,
} from '@/utils/locationSimulatiom.js';
import { generateServiceId, ServiceKey } from '@/utils/serverIdHandler.js';
import { WebSocket } from 'ws';

/**
 * 订单订阅管理
 * 维护 orderId -> Set<WebSocket> 的关系，供轨迹广播使用
 * 每个订单可以有多个订阅者（例如用户端、商家端同时订阅）
 */
const orderSubscriptions = new Map<number, Set<WebSocket>>();

/** 订阅指定订单的轨迹更新，如果当前有正在运行的模拟轨迹服务，则返回当前状态 */
export async function subscribeOrderShipping(ws: WebSocket, orderId: number) {
  const set = orderSubscriptions.get(orderId) ?? new Set<WebSocket>();
  set.add(ws);

  orderSubscriptions.set(orderId, set);

  // 尝试恢复物流模拟服务（后端重启导致轮询丢失）
  try {
    const state = await logisticsService.simulateShipment(orderId, true);
    if (state) {
      return generateRealtimeLocationFromState(state);
    }
    // 如果服务未运行，启动新的模拟轨迹服务
  } catch (error) {
    console.error(`恢复 ${orderId} 订单的物流模拟服务失败`, error);
  }
  return null;
}

/** 取消订阅指定订单的轨迹更新 */
export function unsubscribeOrderShipping(ws: WebSocket, orderId: number) {
  const set = orderSubscriptions.get(orderId);
  if (set) {
    set.delete(ws);
    if (set.size === 0) {
      // 如果不再有任何客户监听此订单，则取消对该订单物流轨迹的轮询
      logisticsService.stopPolling(orderId);
      orderSubscriptions.delete(orderId);
    }
  }
}

/** 广播订单轨迹更新给所有订阅者 */
export function broadcastOrderShipping(orderId: number, payload: RealtimeLocation) {
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
      // 取消对该订单的订阅并清理
      unsubscribeOrderShipping(ws, orderId);
    }
  }
}
