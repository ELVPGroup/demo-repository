import http from 'http';
import app from './app.js';
import { initWebSocket } from '@/ws/index.js';

const server = http.createServer(app.callback());

initWebSocket(server);

const PORT = process.env['PORT'] || 3000;
server.listen(PORT, () => {
  console.log('HTTP+WS server running on port', PORT);
});
