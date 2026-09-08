import type { Server } from 'http';
import jwt from 'jsonwebtoken';
import { WebSocketServer, WebSocket } from 'ws';
import { env } from '../config/env';

type AuthedWebSocket = WebSocket & { userId?: string };

const userSockets = new Map<string, Set<AuthedWebSocket>>();

let wss: WebSocketServer | null = null;

const WS_PATH = '/api/messages/ws';

export function initWebSocketServer(server: Server) {
  if (wss) {
    return wss;
  }

  // noServer + a manual, non-destructive path check lets this coexist with other
  // WebSocketServers on the same http.Server (e.g. the games WS). ws's built-in
  // {server, path} mode aborts ANY mismatched upgrade with an HTTP 400 the instant
  // its own path doesn't match, which breaks sibling WebSocketServers registered
  // on the same server — each one's internal listener runs for every upgrade event.
  wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    if (url.pathname !== WS_PATH) return;
    wss!.handleUpgrade(req, socket, head, (ws) => {
      wss!.emit('connection', ws, req);
    });
  });

  wss.on('connection', (socket: AuthedWebSocket, req) => {
    try {
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const token = url.searchParams.get('token') || undefined;

      if (!token) {
        socket.close(4001, 'Missing token');
        return;
      }

      const decoded = jwt.verify(token, env.jwtSecret) as any;
      const userId = decoded.userId as string | undefined;

      if (!userId) {
        socket.close(4002, 'Invalid token');
        return;
      }

      socket.userId = userId;

      let set = userSockets.get(userId);
      if (!set) {
        set = new Set();
        userSockets.set(userId, set);
      }
      set.add(socket);

      socket.on('close', () => {
        const sockets = userSockets.get(userId);
        if (!sockets) return;
        sockets.delete(socket);
        if (sockets.size === 0) {
          userSockets.delete(userId);
        }
      });
    } catch {
      socket.close(4003, 'Auth failed');
    }
  });

  return wss;
}

interface NewMessagePayload {
  type: 'message:new';
  conversationId: string;
  message: any;
}

export function broadcastNewMessage(conversationId: string, message: any, memberUserIds: string[]) {
  if (!wss) return;

  const payload: NewMessagePayload = {
    type: 'message:new',
    conversationId,
    message,
  };

  const data = JSON.stringify(payload);

  for (const userId of memberUserIds) {
    const sockets = userSockets.get(userId);
    if (!sockets) continue;
    for (const socket of sockets) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(data);
      }
    }
  }
}

