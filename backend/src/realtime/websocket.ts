import type { Server } from 'http';
import jwt from 'jsonwebtoken';
import { WebSocketServer, WebSocket } from 'ws';
import { env } from '../config/env';
import { publishChannel, REDIS_CHANNELS, subscribeChannel } from '../lib/redis';
import { getSharedWebSocketServer, registerSocketPath } from './shared-wss';

type AuthedWebSocket = WebSocket & { userId?: string };

const userSockets = new Map<string, Set<AuthedWebSocket>>();

let wss: WebSocketServer | null = null;
let subscribed = false;

const WS_PATH = '/api/messages/ws';

interface NewMessagePayload {
  type: 'message:new';
  conversationId: string;
  message: unknown;
  memberUserIds: string[];
}

function fanoutNewMessage(payload: NewMessagePayload) {
  const data = JSON.stringify({
    type: payload.type,
    conversationId: payload.conversationId,
    message: payload.message,
  });
  for (const userId of payload.memberUserIds) {
    const sockets = userSockets.get(userId);
    if (!sockets) continue;
    for (const socket of sockets) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(data);
      }
    }
  }
}

function ensureRedisFanout() {
  if (subscribed) return;
  subscribed = true;
  subscribeChannel(REDIS_CHANNELS.messages, (raw) => {
    const payload = raw as NewMessagePayload;
    if (!payload || payload.type !== 'message:new') return;
    fanoutNewMessage(payload);
  });
}

export function initWebSocketServer(server: Server) {
  if (wss) {
    return wss;
  }

  ensureRedisFanout();

  wss = getSharedWebSocketServer(server);
  registerSocketPath(WS_PATH, (rawSocket, req) => {
    const socket = rawSocket as AuthedWebSocket;
    try {
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const token = url.searchParams.get('token') || undefined;

      if (!token) {
        socket.close(4001, 'Missing token');
        return;
      }

      const decoded = jwt.verify(token, env.jwtSecret) as { userId?: string };
      const userId = decoded.userId;

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

export async function broadcastNewMessage(conversationId: string, message: unknown, memberUserIds: string[]) {
  const payload: NewMessagePayload = {
    type: 'message:new',
    conversationId,
    message,
    memberUserIds,
  };
  await publishChannel(REDIS_CHANNELS.messages, payload);
}
