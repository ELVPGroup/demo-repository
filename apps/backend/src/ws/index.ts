import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';

import jwt from 'jsonwebtoken';
import { authService } from '@/services/authService.js';
import type { IncomingMessage } from 'http';
import { setupHeartbeat } from './heartbeat.js';
import { handleMessage } from './handlers.js';
import { cleanupSubscriptionsFor } from './orderSubscriptions.js';

export function initWebSocket(server: Server) {
  const wss = new WebSocketServer({ noServer: true }); // noServer只处理手动通过的连接

  // 响应 WebSocket 升级请求
  server.on('upgrade', async (req: IncomingMessage & { user?: jwt.JwtPayload }, socket, head) => {
    try {
      const protocols = req.headers['sec-websocket-protocol'];
      if (!protocols) {
        throw new Error('Missing or invalid Authorization header');
      }
      const [, token] = protocols.split(',').map((v) => v.trim());
      // 验证 token
      if (!token) {
        throw new Error('Missing or invalid token');
      }
      const decoded = authService.verifyToken(token);
      // 将用户信息附加到 req 上
      req.user = decoded;

      if (req.url && req.url.startsWith('/ws')) {
        wss.handleUpgrade(req, socket, head, (ws: WebSocket) => {
          wss.emit('connection', ws, req);
        });
      } else {
        // 非 /ws 路径，拒绝 WebSocket 升级
        socket.destroy();
      }
    } catch (error) {
      console.error('WebSocket upgrade error:', error);
      socket.destroy();
    }
  });

  wss.on('connection', (ws: WebSocket, req: IncomingMessage & { user?: jwt.JwtPayload }) => {
    console.log('New WebSocket connection from user:', req.user);

    // 处理 WebSocket 消息
    ws.on('message', (message) => {
      console.log('Received message:', message.toString());
      handleMessage(ws, message.toString(), req.user || {});
    });

    // 处理 WebSocket 关闭
    ws.on('close', () => {
      console.log('WebSocket connection closed for user:', req.user);
      cleanupSubscriptionsFor(ws);
    });

    setupHeartbeat(ws);
  });

  return wss;
}
