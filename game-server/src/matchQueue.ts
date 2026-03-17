import { Difficulty, Player } from './types';

// 按难度分桶的匹配队列
const queues = new Map<Difficulty, Player[]>([
  ['easy', []],
  ['normal', []],
  ['hard', []],
]);

/**
 * 加入匹配队列
 * 如果该 socketId 已在队列中则更新信息
 */
export function joinQueue(player: Player): void {
  const queue = queues.get(player.difficulty)!;
  // 去除已存在的同 socketId（重连/重试情况）
  const idx = queue.findIndex(p => p.socketId === player.socketId);
  if (idx !== -1) {
    queue.splice(idx, 1);
  }
  queue.push(player);
  console.log(`[Queue] ${player.name}(${player.socketId}) joined ${player.difficulty} queue. Size: ${queue.length}`);
}

/**
 * 离开匹配队列
 */
export function leaveQueue(socketId: string): void {
  for (const queue of queues.values()) {
    const idx = queue.findIndex(p => p.socketId === socketId);
    if (idx !== -1) {
      const removed = queue.splice(idx, 1)[0];
      console.log(`[Queue] ${removed.name}(${socketId}) left queue`);
      return;
    }
  }
}

/**
 * 尝试按指定难度匹配两名玩家
 * 如果同难度队列有 >= 2 人，取出最早的两人配对
 * 返回 [player1, player2] 或 null
 */
export function tryMatch(difficulty: Difficulty): [Player, Player] | null {
  const queue = queues.get(difficulty)!;
  if (queue.length >= 2) {
    const p1 = queue.shift()!;
    const p2 = queue.shift()!;
    console.log(`[Queue] Matched: ${p1.name} vs ${p2.name} (${difficulty})`);
    return [p1, p2];
  }
  return null;
}

/**
 * 根据 socketId 查找其所在难度
 */
export function findPlayerDifficulty(socketId: string): Difficulty | null {
  for (const [diff, queue] of queues.entries()) {
    if (queue.some(p => p.socketId === socketId)) {
      return diff;
    }
  }
  return null;
}

/**
 * 获取各难度队列大小
 */
export function getQueueSizes(): Record<Difficulty, number> {
  return {
    easy: queues.get('easy')!.length,
    normal: queues.get('normal')!.length,
    hard: queues.get('hard')!.length,
  };
}

/**
 * 获取总等待人数
 */
export function getTotalQueueSize(): number {
  let total = 0;
  for (const queue of queues.values()) total += queue.length;
  return total;
}
