import { io, Socket } from 'socket.io-client';
import { Idiom } from '../data/idioms';

// ── 服务端事件类型（与 game-server/src/types.ts 保持一致） ──

export type Difficulty = 'easy' | 'normal' | 'hard';

export interface BulletSlotNet {
  chamber: number;
  hasBullet: boolean;
  fired: boolean;
}

export interface MatchFoundPayload {
  roomId: string;
  opponentName: string;
  firstTurn: boolean;
  currentIdiom: Idiom;
  difficulty: Difficulty;
  playerSlots: BulletSlotNet[];
  opponentSlots: BulletSlotNet[];
}

export interface GameValidateResultPayload {
  valid: boolean;
  idiomData?: Idiom;
  errorType?: 'not-idiom' | 'wrong-chain';
  nextTurn: string;
}

export interface GameOpponentSubmitPayload {
  idiom: Idiom;
  valid: boolean;
}

export interface GameRoulettePayload {
  target: 'you' | 'opponent';
  hit: boolean;
  chamber: number;
  playerSlots: BulletSlotNet[];
  opponentSlots: BulletSlotNet[];
}

export interface GameOverPayload {
  winner: 'you' | 'opponent' | 'draw';
  reason: 'roulette' | 'opponent-left';
  stats: {
    rounds: number;
    chainHistory: string[];
  };
}

export interface GameStateUpdatePayload {
  currentIdiom: Idiom;
  round: number;
  yourTurn: boolean;
  playerSlots: BulletSlotNet[];
  opponentSlots: BulletSlotNet[];
}

export interface QueueStatusPayload {
  totalWaiting: number;
  queues: Record<Difficulty, number>;
}

// ── Socket 单例 ──
const SERVER_URL = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:3001';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SERVER_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

export function connectSocket(): void {
  getSocket().connect();
}

export function disconnectSocket(): void {
  socket?.disconnect();
}

// ── 发送事件 ──

export function emitMatchJoin(playerName: string, difficulty: Difficulty): void {
  getSocket().emit('match:join', { playerName, difficulty });
}

export function emitMatchCancel(): void {
  getSocket().emit('match:cancel', {});
}

export function emitGameSubmit(roomId: string, idiom: string): void {
  getSocket().emit('game:submit', { roomId, idiom });
}

export function emitGameTimeout(roomId: string): void {
  getSocket().emit('game:timeout', { roomId });
}

// ── 事件监听辅助 ──
// 注册监听并返回清理函数，方便在 useEffect 中使用

export function onMatchQueued(cb: (data: { message: string; queueSize: number }) => void): () => void {
  const s = getSocket();
  s.on('match:queued', cb);
  return () => s.off('match:queued', cb);
}

export function onMatchFound(cb: (data: MatchFoundPayload) => void): () => void {
  const s = getSocket();
  s.on('match:found', cb);
  return () => s.off('match:found', cb);
}

export function onMatchCancelled(cb: (data: { message: string }) => void): () => void {
  const s = getSocket();
  s.on('match:cancelled', cb);
  return () => s.off('match:cancelled', cb);
}

export function onGameValidateResult(cb: (data: GameValidateResultPayload) => void): () => void {
  const s = getSocket();
  s.on('game:validate_result', cb);
  return () => s.off('game:validate_result', cb);
}

export function onGameOpponentSubmit(cb: (data: GameOpponentSubmitPayload) => void): () => void {
  const s = getSocket();
  s.on('game:opponent_submit', cb);
  return () => s.off('game:opponent_submit', cb);
}

export function onGameRoulette(cb: (data: GameRoulettePayload) => void): () => void {
  const s = getSocket();
  s.on('game:roulette', cb);
  return () => s.off('game:roulette', cb);
}

export function onGameOver(cb: (data: GameOverPayload) => void): () => void {
  const s = getSocket();
  s.on('game:over', cb);
  return () => s.off('game:over', cb);
}

export function onGameStateUpdate(cb: (data: GameStateUpdatePayload) => void): () => void {
  const s = getSocket();
  s.on('game:state_update', cb);
  return () => s.off('game:state_update', cb);
}

export function onQueueStatus(cb: (data: QueueStatusPayload) => void): () => void {
  const s = getSocket();
  s.on('queue:status', cb);
  return () => s.off('queue:status', cb);
}

export function onGameError(cb: (data: { message: string }) => void): () => void {
  const s = getSocket();
  s.on('game:error', cb);
  return () => s.off('game:error', cb);
}

export function onConnect(cb: () => void): () => void {
  const s = getSocket();
  s.on('connect', cb);
  return () => s.off('connect', cb);
}

export function onDisconnect(cb: (reason: string) => void): () => void {
  const s = getSocket();
  s.on('disconnect', cb);
  return () => s.off('disconnect', cb);
}

export function onConnectError(cb: (err: Error) => void): () => void {
  const s = getSocket();
  s.on('connect_error', cb);
  return () => s.off('connect_error', cb);
}

/** 是否已连接 */
export function isConnected(): boolean {
  return socket?.connected ?? false;
}
