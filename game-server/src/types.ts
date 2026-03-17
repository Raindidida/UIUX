// 共享类型定义

export type Difficulty = 'easy' | 'normal' | 'hard';

export interface Idiom {
  text: string;
  first: string; // 首字拼音（无声调）
  last: string;  // 末字拼音（无声调）
}

export interface BulletSlot {
  chamber: number;
  hasBullet: boolean;
  fired: boolean;
}

export interface Player {
  socketId: string;
  name: string;
  difficulty: Difficulty;
  joinedAt: number;
}

export interface Room {
  id: string;
  player1: Player;
  player2: Player;
  currentTurn: string;       // socketId of player whose turn it is
  currentIdiom: Idiom;
  chainHistory: string[];
  round: number;
  slots: Record<string, BulletSlot[]>; // socketId -> slots
  createdAt: number;
}

// ── WebSocket 事件类型 ──

// Client → Server
export interface MatchJoinPayload {
  playerName: string;
  difficulty: Difficulty;
}

export interface GameSubmitPayload {
  roomId: string;
  idiom: string; // 玩家输入的成语文字
}

export interface MatchCancelPayload {
  // empty
}

// Server → Client
export interface MatchFoundPayload {
  roomId: string;
  opponentName: string;
  firstTurn: boolean;         // true = 你先手
  currentIdiom: Idiom;
  difficulty: Difficulty;
  playerSlots: BulletSlot[];
  opponentSlots: BulletSlot[];
}

export interface GameValidateResultPayload {
  valid: boolean;
  idiomData?: Idiom;           // 验证通过后的成语数据
  errorType?: 'not-idiom' | 'wrong-chain';
  nextTurn: string;            // socketId of next turn player
}

export interface GameOpponentSubmitPayload {
  idiom: Idiom;
  valid: boolean;
}

export interface GameRoulettePayload {
  target: 'you' | 'opponent';  // 相对于当前客户端
  hit: boolean;
  chamber: number;
  playerSlots: BulletSlot[];
  opponentSlots: BulletSlot[];
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
  playerSlots: BulletSlot[];
  opponentSlots: BulletSlot[];
}

export interface QueueStatusPayload {
  queueSize: number;
  difficulty: Difficulty;
}
