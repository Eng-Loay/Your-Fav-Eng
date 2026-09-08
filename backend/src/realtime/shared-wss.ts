import type { IncomingMessage } from 'http';
import type { Server } from 'http';
import { WebSocket, WebSocketServer } from 'ws';

type PathHandler = (socket: WebSocket, req: IncomingMessage) => void;

const handlers = new Map<string, PathHandler>();
let wss: WebSocketServer | null = null;

export function getSharedWebSocketServer(server: Server): WebSocketServer {
  if (wss) return wss;

  wss = new WebSocketServer({ server });
  wss.on('connection', (socket, req) => {
    const pathname = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`).pathname;
    const handler = handlers.get(pathname);
    if (!handler) {
      socket.close(4404, 'Unknown socket path');
      return;
    }
    handler(socket, req);
  });

  return wss;
}

export function registerSocketPath(pathname: string, handler: PathHandler): void {
  handlers.set(pathname, handler);
}
