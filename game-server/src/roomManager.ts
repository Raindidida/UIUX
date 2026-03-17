import { v4 as uuidv4 } from 'uuid';
import {
  Room,
  Player,
  BulletSlot,
  Idiom,
  GameRoulettePayload,
  GameStateUpdatePayload,
} from './types';
import {
  freshBulletSlots,
  fireOnce,
  getRandomStartIdiom,
} from './gameLogic';

// 房间存储：roomId → Room
const rooms = new Map<string, Room>();

// socketId → roomId 反向索引
const socketToRoom = new Map<string, string>();

/**
 * 创建新房间，随机决定先手
 */
export function createRoom(player1: Player, player2: Player): Room {
  const roomId = uuidv4();
  const firstTurn = Math.random() < 0.5 ? player1.socketId : player2.socketId;
  const startIdiom = getRandomStartIdiom();

  const room: Room = {
    id: roomId,
    player1,
    player2,
    currentTurn: firstTurn,
    currentIdiom: startIdiom,
    chainHistory: [startIdiom.text],
    round: 1,
    slots: {
      [player1.socketId]: freshBulletSlots(),
      [player2.socketId]: freshBulletSlots(),
    },
    createdAt: Date.now(),
  };

  rooms.set(roomId, room);
  socketToRoom.set(player1.socketId, roomId);
  socketToRoom.set(player2.socketId, roomId);

  console.log(`[Room] Created ${roomId}: ${player1.name} vs ${player2.name}, first: ${firstTurn === player1.socketId ? player1.name : player2.name}`);
  return room;
}

/**
 * 通过 socketId 获取房间
 */
export function getRoomBySocket(socketId: string): Room | null {
  const roomId = socketToRoom.get(socketId);
  if (!roomId) return null;
  return rooms.get(roomId) ?? null;
}

/**
 * 通过 roomId 获取房间
 */
export function getRoomById(roomId: string): Room | null {
  return rooms.get(roomId) ?? null;
}

/**
 * 获取房间中的对手 socketId
 */
export function getOpponentId(room: Room, socketId: string): string {
  return room.player1.socketId === socketId
    ? room.player2.socketId
    : room.player1.socketId;
}

/**
 * 获取房间中的对手信息
 */
export function getOpponent(room: Room, socketId: string): Player {
  return room.player1.socketId === socketId ? room.player2 : room.player1;
}

/**
 * 获取玩家自己的信息
 */
export function getPlayer(room: Room, socketId: string): Player {
  return room.player1.socketId === socketId ? room.player1 : room.player2;
}

/**
 * 推进回合：玩家成功接龙后更新房间状态
 */
export function advanceTurn(
  room: Room,
  submittedIdiom: Idiom,
  submitterSocketId: string
): Room {
  const opponentId = getOpponentId(room, submitterSocketId);
  const updatedRoom: Room = {
    ...room,
    currentIdiom: submittedIdiom,
    currentTurn: opponentId,  // 轮到对手
    chainHistory: [...room.chainHistory, submittedIdiom.text],
    round: room.round + 1,
  };
  rooms.set(room.id, updatedRoom);
  return updatedRoom;
}

/**
 * 执行轮盘赌：对指定玩家开枪
 * 返回轮盘结果和更新后的房间
 */
export function executeRoulette(
  room: Room,
  targetSocketId: string
): {
  updatedRoom: Room;
  hit: boolean;
  chamberId: number;
} {
  const currentSlots = room.slots[targetSocketId];
  const { nextSlots, hit, chamberId } = fireOnce(currentSlots);

  const updatedRoom: Room = {
    ...room,
    slots: {
      ...room.slots,
      [targetSocketId]: nextSlots,
    },
  };

  if (!hit) {
    // 侥幸存活：轮到下一个人（对手继续或自己继续，取决于谁挨打）
    const opponentId = getOpponentId(room, targetSocketId);
    // 存活后：轮到对手继续接龙（被打的人侥幸存活，对手要接龙）
    updatedRoom.currentTurn = opponentId;
    updatedRoom.round = room.round + 1;
    updatedRoom.chainHistory = [
      ...room.chainHistory,
      `[${targetSocketId === room.player1.socketId ? room.player1.name : room.player2.name}侥幸存活]`,
    ];
  }

  rooms.set(room.id, updatedRoom);
  return { updatedRoom, hit, chamberId };
}

/**
 * 超时惩罚：轮到某人但未在时间内提交
 * 等同于接龙失败，对该玩家执行轮盘赌
 */
export function handleTimeout(room: Room, timerSocketId: string) {
  return executeRoulette(room, timerSocketId);
}

/**
 * 删除房间（游戏结束或玩家断线）
 */
export function deleteRoom(roomId: string): void {
  const room = rooms.get(roomId);
  if (!room) return;
  socketToRoom.delete(room.player1.socketId);
  socketToRoom.delete(room.player2.socketId);
  rooms.delete(roomId);
  console.log(`[Room] Deleted ${roomId}`);
}

/**
 * 玩家断线：检查是否在某房间内，若是则通知对手并销毁房间
 * 返回 { room, opponentId } 或 null
 */
export function handleDisconnect(socketId: string): {
  room: Room;
  opponentId: string;
} | null {
  const room = getRoomBySocket(socketId);
  if (!room) return null;
  const opponentId = getOpponentId(room, socketId);
  deleteRoom(room.id);
  return { room, opponentId };
}

/**
 * 构造发给某客户端的游戏状态更新数据
 */
export function buildStateUpdate(room: Room, socketId: string): GameStateUpdatePayload {
  const opponentId = getOpponentId(room, socketId);
  return {
    currentIdiom: room.currentIdiom,
    round: room.round,
    yourTurn: room.currentTurn === socketId,
    playerSlots: room.slots[socketId],
    opponentSlots: room.slots[opponentId],
  };
}

/**
 * 构造发给某客户端的轮盘赌数据
 */
export function buildRoulettePayload(
  room: Room,
  socketId: string,
  targetSocketId: string,
  hit: boolean,
  chamberId: number
): GameRoulettePayload {
  const opponentId = getOpponentId(room, socketId);
  return {
    target: targetSocketId === socketId ? 'you' : 'opponent',
    hit,
    chamber: chamberId,
    playerSlots: room.slots[socketId],
    opponentSlots: room.slots[opponentId],
  };
}

/**
 * 获取当前房间总数（监控用）
 */
export function getRoomCount(): number {
  return rooms.size;
}
