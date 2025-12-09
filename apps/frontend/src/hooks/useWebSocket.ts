import { useEffect, useRef, useCallback, useState } from 'react';
import { useUserStore } from '@/store/userStore';
import { message } from 'antd';
import { BASE_WS_URL } from '@/config';

export enum MessageTypeEnum {
  /** 订阅物流位置更新 */
  ShippingSubscribe = 'shipping_subscribe',
  /** 取消物流位置更新订阅 */
  ShippingUnsubscribe = 'shipping_unsubscribe',

  // 新增位置相关的消息类型
  LocationSubscribe = 'LOCATION_SUBSCRIBE',
  LocationUnsubscribe = 'LOCATION_UNSUBSCRIBE',
  LocationUpdate = 'LOCATION_UPDATE',
  LocationHistory = 'LOCATION_HISTORY',
}

/**
 * useWebSocket - 用于 WebSocket 通信的 React 钩子。
 *
 * @param path - 要连接的 WebSocket 服务器路径，会拼接在 BASE_WS_URL 后面。
 * @param onMessage - 收到消息时的回调函数，参数为解析后的消息对象。
 * @returns 一个包含 `sendMessage` 方法的对象，用于向服务器发送数据。
 */
export function useWebSocket(path: string, onMessage: (msg: unknown) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);

  // 使用 ref 存储最新 onMessage，避免依赖 effect
  const messageHandlerRef = useRef(onMessage);
  useEffect(() => {
    messageHandlerRef.current = onMessage;
  }, [onMessage]);

  /**
   * sendMessage - 向 WebSocket 服务器发送消息。
   *
   * @param type - 消息类型，必须是 MessageTypeEnum 枚举中的一种。
   * @param data - 要发送的数据，任意类型。
   */
  const sendMessage = useCallback((type: MessageTypeEnum, data: unknown) => {
    let payload;
    switch (type) {
      case MessageTypeEnum.ShippingSubscribe:
      case MessageTypeEnum.ShippingUnsubscribe:
        payload = { type, orderId: data };
        break;
      // ... 可以在此添加其他消息类型的处理
      default:
        payload = { type };
        break;
    }
    if (wsRef.current && wsRef.current.readyState == WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }, []);

  useEffect(() => {
    const token = useUserStore.getState().token;
    if (!token) {
      message.error('请先登录');
      return;
    }
    const ws = new WebSocket(`${BASE_WS_URL}${path}`, ['Bearer', token]); // 传递认证信息
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      console.log('WS connected');
    };
    ws.onclose = () => {
      setConnected(false);
      console.log('WS closed');
    };
    ws.onerror = (e) => {
      console.error('WS error', e);
      setConnected(false);
      ws.close();
    };
    ws.onmessage = (e) => {
      const text = typeof e.data === 'string' ? e.data : String(e.data);
      try {
        const msg = JSON.parse(text);
        /**
         * 解析消息，返回 { type, data? } 的格式
         */
        messageHandlerRef.current(msg);
      } catch {
        messageHandlerRef.current({ type: 'unknown', data: e.data });
      }
    };

    return () => ws.close();
  }, [path]);

  return { sendMessage, connected };
}
