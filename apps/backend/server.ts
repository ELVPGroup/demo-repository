import http from 'http';
import app from './app.js';
import { initWebSocket } from '@/ws/index.js';
import { startAutoConfirmJob } from '@/jobs/autoConfirmOrder.js';

const server = http.createServer(app.callback());

initWebSocket(server);

// 启动订单到时自动确认收货任务
startAutoConfirmJob();

const PORT = process.env['PORT'] || 3000;
server.listen(PORT, () => {
  console.log('HTTP+WS server running on port', PORT);
});
