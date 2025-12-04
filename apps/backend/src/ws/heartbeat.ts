import type { WebSocket } from 'ws';

interface WebSocketWithAlive extends WebSocket {
  isAlive?: boolean;
}

const HEARTBEAT_INTERVAL = 30000;

/**
 * 建立心跳机制
 */
export function setupHeartbeat(ws: WebSocketWithAlive) {
  ws.isAlive = true;

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  // 30秒未收到心跳包则关闭连接
  const interval = setInterval(() => {
    if (!ws.isAlive) {
      ws.terminate();
      console.log('心跳超时，WebSocket连接已断开');
      clearInterval(interval);
      return;
    }
    ws.isAlive = false;
    ws.ping();
  }, HEARTBEAT_INTERVAL);

  ws.on('close', () => {
    clearInterval(interval);
  });

  ws.on('error', () => {
    clearInterval(interval);
  });
}
