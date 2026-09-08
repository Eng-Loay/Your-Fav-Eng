import type { Server } from 'http';
import jwt from 'jsonwebtoken';
import { WebSocketServer, WebSocket } from 'ws';
import { env } from '../config/env';
import prisma from '../config/database';
import { gamesService } from '../modules/games/games.service';
import { publishChannel, REDIS_CHANNELS, subscribeChannel } from '../lib/redis';
import { getSharedWebSocketServer, registerSocketPath } from './shared-wss';

type Role = 'host' | 'player';

type GameSocket = WebSocket & { userId?: string; sessionId?: string; role?: Role };

interface Room {
  hostSockets: Set<GameSocket>;
  playerSockets: Map<string, Set<GameSocket>>;
}

const rooms = new Map<string, Room>();

function getOrCreateRoom(sessionId: string): Room {
  let room = rooms.get(sessionId);
  if (!room) {
    room = { hostSockets: new Set(), playerSockets: new Map() };
    rooms.set(sessionId, room);
  }
  return room;
}

function removeFromRoom(socket: GameSocket) {
  if (!socket.sessionId) return;
  const room = rooms.get(socket.sessionId);
  if (!room) return;

  room.hostSockets.delete(socket);
  if (socket.userId) {
    const set = room.playerSockets.get(socket.userId);
    if (set) {
      set.delete(socket);
      if (set.size === 0) room.playerSockets.delete(socket.userId);
    }
  }
  if (room.hostSockets.size === 0 && room.playerSockets.size === 0) {
    rooms.delete(socket.sessionId);
  }
}

function send(socket: GameSocket, type: string, payload: any) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type, ...payload }));
  }
}

type GameFanout =
  | { kind: 'host'; sessionId: string; type: string; payload: any }
  | { kind: 'player'; sessionId: string; userId: string; type: string; payload: any }
  | { kind: 'room'; sessionId: string; type: string; payload: any };

function applyGameFanout(event: GameFanout) {
  const room = rooms.get(event.sessionId);
  if (!room) return;
  if (event.kind === 'host') {
    for (const socket of room.hostSockets) send(socket, event.type, event.payload);
    return;
  }
  if (event.kind === 'player') {
    const set = room.playerSockets.get(event.userId);
    if (!set) return;
    for (const socket of set) send(socket, event.type, event.payload);
    return;
  }
  for (const socket of room.hostSockets) send(socket, event.type, event.payload);
  for (const set of room.playerSockets.values()) {
    for (const socket of set) send(socket, event.type, event.payload);
  }
}

function broadcastToHost(sessionId: string, type: string, payload: any) {
  void publishChannel(REDIS_CHANNELS.games, { kind: 'host', sessionId, type, payload } satisfies GameFanout);
}

function broadcastToPlayer(sessionId: string, userId: string, type: string, payload: any) {
  void publishChannel(REDIS_CHANNELS.games, { kind: 'player', sessionId, userId, type, payload } satisfies GameFanout);
}

function broadcastToRoom(sessionId: string, type: string, payload: any) {
  void publishChannel(REDIS_CHANNELS.games, { kind: 'room', sessionId, type, payload } satisfies GameFanout);
}

async function broadcastLobbyUpdate(sessionId: string) {
  const participants = await gamesService.getLobbyParticipants(sessionId);
  const payload = {
    participants: participants.map((p) => ({
      userId: p.userId,
      name: p.user.name,
      avatar: p.user.avatar,
      joinedAt: p.joinedAt,
    })),
  };
  broadcastToRoom(sessionId, 'lobby:update', payload);
}

let wss: WebSocketServer | null = null;
let subscribed = false;

const WS_PATH = '/api/games/ws';

function ensureRedisFanout() {
  if (subscribed) return;
  subscribed = true;
  subscribeChannel(REDIS_CHANNELS.games, (raw) => {
    const event = raw as GameFanout;
    if (!event || !event.kind || !event.sessionId) return;
    applyGameFanout(event);
  });
}

export function initGameWebSocketServer(server: Server) {
  if (wss) return wss;
  ensureRedisFanout();

  wss = getSharedWebSocketServer(server);
  registerSocketPath(WS_PATH, (rawSocket, req) => {
    const socket = rawSocket as GameSocket;
    void (async () => {
    // Attach the message listener synchronously, before any `await` below, so a client
    // that sends its first message immediately on `open` can't have it silently dropped
    // while the async auth/role-resolution setup is still in flight. Messages are queued
    // until setup finishes, then replayed in order.
    let ready = false
    const pending: Buffer[] = []
    socket.on('message', (raw: Buffer) => {
      if (!ready) {
        pending.push(raw)
        return
      }
      handleRawMessage(socket, raw)
    })

    try {
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const token = url.searchParams.get('token') || undefined;
      const sessionId = url.searchParams.get('sessionId') || undefined;

      if (!token || !sessionId) {
        socket.close(4001, 'Missing token or sessionId');
        return;
      }

      const decoded = jwt.verify(token, env.jwtSecret) as any;
      const userId = decoded.userId as string | undefined;
      if (!userId) {
        socket.close(4002, 'Invalid token');
        return;
      }

      const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
      if (!user) {
        socket.close(4002, 'Invalid token');
        return;
      }

      const role = await gamesService.resolveSessionRole(sessionId, userId, user.role);
      if (!role) {
        socket.close(4403, 'Forbidden');
        return;
      }

      const session = await prisma.gameSession.findUnique({ where: { id: sessionId } });
      if (!session) {
        socket.close(4404, 'Session not found');
        return;
      }

      if (session.status === 'ENDED') {
        const leaderboard = await gamesService.getSessionLeaderboard(sessionId);
        send(socket, 'game:ended', { leaderboard, reason: session.endedReason ?? 'host_ended' });
        socket.close(4000, 'Session ended');
        return;
      }

      socket.userId = userId;
      socket.sessionId = sessionId;
      socket.role = role;

      const room = getOrCreateRoom(sessionId);

      if (role === 'host') {
        room.hostSockets.add(socket);
      } else {
        if (session.status === 'LOBBY') {
          const joinResult = await gamesService.joinLobby(sessionId, userId);
          if ('error' in joinResult) {
            socket.close(4409, joinResult.error);
            return;
          }
        } else {
          // ACTIVE: only an existing participant may reconnect, never a fresh join.
          const joinResult = await gamesService.joinLobby(sessionId, userId);
          if ('error' in joinResult || !joinResult.resumed) {
            socket.close(4409, 'Game already started');
            return;
          }
        }
        let set = room.playerSockets.get(userId);
        if (!set) {
          set = new Set();
          room.playerSockets.set(userId, set);
        }
        set.add(socket);
      }

      socket.on('close', () => removeFromRoom(socket));

      if (role === 'host') {
        await broadcastLobbyUpdate(sessionId);
      } else if (session.status === 'LOBBY') {
        await broadcastLobbyUpdate(sessionId);
      } else if (session.status === 'ACTIVE') {
        // Resume mid-game: send the player their current question snapshot.
        const detail = await gamesService.getSessionDetail(sessionId);
        const participant = detail?.participants.find((p) => p.userId === userId);
        const questions = detail?.game.lesson ? await prisma.gameQuestion.findMany({ where: { gameId: detail.game.id }, orderBy: { order: 'asc' } }) : [];
        const current = participant && !participant.completed ? questions[participant.currentQuestionIndex] : null;
        send(socket, 'game:resume', {
          score: participant?.score ?? 0,
          streak: participant?.streak ?? 0,
          completed: participant?.completed ?? true,
          question: current ? gamesService.sanitizeQuestion(current) : null,
          timerSeconds: detail?.timerSeconds ?? 30,
        });
      }

      ready = true;
      for (const raw of pending) {
        handleRawMessage(socket, raw);
      }
      pending.length = 0;
    } catch {
      socket.close(4003, 'Auth failed');
    }
    })();
  });

  return wss;
}

function handleRawMessage(socket: GameSocket, raw: Buffer) {
  try {
    const msg = JSON.parse(raw.toString());
    void handleMessage(socket, msg);
  } catch {
    send(socket, 'error', { code: 'bad_message', message: 'Invalid message' });
  }
}

async function handleMessage(socket: GameSocket, msg: { type: string; [key: string]: any }) {
  if (!socket.sessionId || !socket.userId) return;
  const sessionId = socket.sessionId;

  if (msg.type === 'host:start' && socket.role === 'host') {
    const result = await gamesService.startSession(sessionId, socket.userId, Number(msg.timerSeconds) || 30);
    if ('error' in result) {
      send(socket, 'error', { code: result.error, message: 'Could not start game' });
      return;
    }
    broadcastToHost(sessionId, 'game:started', { timerSeconds: result.timerSeconds, totalQuestions: result.totalQuestions });
    const participants = await gamesService.getLobbyParticipants(sessionId);
    for (const p of participants) {
      broadcastToPlayer(sessionId, p.userId, 'question:show', {
        question: result.firstQuestion,
        timerSeconds: result.timerSeconds,
        index: 0,
        totalQuestions: result.totalQuestions,
      });
    }
    return;
  }

  if (msg.type === 'host:end' && socket.role === 'host') {
    const result = await gamesService.endSession(sessionId, socket.userId);
    if ('error' in result) {
      send(socket, 'error', { code: result.error, message: 'Could not end game' });
      return;
    }
    const leaderboard = await gamesService.getSessionLeaderboard(sessionId);
    broadcastToRoom(sessionId, 'game:ended', { leaderboard, reason: 'host_ended' });
    return;
  }

  if (msg.type === 'player:submit-answer' && socket.role === 'player') {
    const result = await gamesService.submitAnswer(sessionId, socket.userId, msg.questionId, msg.answer);
    if ('error' in result) {
      send(socket, 'error', { code: result.error, message: 'Could not submit answer' });
      return;
    }
    send(socket, 'answer:result', {
      correct: result.isCorrect,
      pointsEarned: result.pointsEarned,
      newScore: result.newScore,
      newStreak: result.newStreak,
      nextQuestion: result.nextQuestion,
      completed: result.completed,
    });
    broadcastToHost(sessionId, 'host:progress', {
      userId: socket.userId,
      score: result.newScore,
      streak: result.newStreak,
      completed: result.completed,
    });
    if (result.sessionEnded) {
      const leaderboard = await gamesService.getSessionLeaderboard(sessionId);
      broadcastToRoom(sessionId, 'game:ended', { leaderboard, reason: 'all_completed' });
    }
  }
}
