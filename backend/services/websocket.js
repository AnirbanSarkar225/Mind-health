import { WebSocketServer } from 'ws';

const clients = new Set();
let wss;

export function setupWebSocket(server) {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    console.log('[WebSocket] Client connected');
    clients.add(ws);
    ws.isAlive = true;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('close', () => {
      console.log('[WebSocket] Client disconnected');
      clients.delete(ws);
    });

    ws.on('error', (err) => {
      console.error('[WebSocket] Error:', err);
      clients.delete(ws);
    });
  });

  const interval = setInterval(() => {
    for (const ws of clients) {
      if (ws.isAlive === false) {
        clients.delete(ws);
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    }
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });
}

export function broadcast(type, data) {
  const payload = JSON.stringify({
    type,
    data,
    timestamp: Date.now()
  });

  for (const client of clients) {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(payload);
    }
  }
}

export function getClientCount() {
  return clients.size;
}
