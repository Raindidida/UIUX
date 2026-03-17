import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';

import {
  joinQueue,
  leaveQueue,
  tryMatch,
  getTotalQueueSize,
  getQueueSizes,
} from './matchQueue';
import {
  createRoom,
  getRoomBySocket,
  getOpponentId,
  advanceTurn,
  executeRoulette,
  handleDisconnect,
  deleteRoom,
  buildStateUpdate,
  buildRoulettePayload,
  getRoomCount,
} from './roomManager';
import { validateIdiomLocal } from './gameLogic';
import {
  MatchJoinPayload,
  GameSubmitPayload,
  MatchFoundPayload,
  GameValidateResultPayload,
  GameOpponentSubmitPayload,
  GameRoulettePayload,
  GameOverPayload,
  Idiom,
  Difficulty,
} from './types';

const PORT = process.env.PORT ?? 3001;

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*',   // 开发阶段允许所有来源
    methods: ['GET', 'POST'],
  },
  pingTimeout: 20000,
  pingInterval: 10000,
});

// ── HTTP 健康检查 ──
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    rooms: getRoomCount(),
    queues: getQueueSizes(),
    totalWaiting: getTotalQueueSize(),
    uptime: process.uptime(),
  });
});

// ── 定期广播队列人数给所有等待中的客户端 ──
setInterval(() => {
  io.emit('queue:status', {
    totalWaiting: getTotalQueueSize(),
    queues: getQueueSizes(),
  });
}, 3000);

// ── Socket.IO 主逻辑 ──
io.on('connection', (socket: Socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  // ── 1. 玩家加入匹配队列 ──
  socket.on('match:join', (payload: MatchJoinPayload) => {
    const { playerName, difficulty } = payload;
    const name = (playerName || '匿名玩家').slice(0, 16).trim() || '匿名玩家';

    const player = {
      socketId: socket.id,
      name,
      difficulty,
      joinedAt: Date.now(),
    };

    joinQueue(player);

    // 立即通知玩家已入队
    socket.emit('match:queued', {
      message: `已加入 ${difficulty} 队列，等待对手…`,
      queueSize: getTotalQueueSize(),
    });

    // 尝试匹配
    const matched = tryMatch(difficulty);
    if (matched) {
      const [p1, p2] = matched;
      const room = createRoom(p1, p2);

      // 让双方加入同一个 Socket.IO 房间
      const p1Socket = io.sockets.sockets.get(p1.socketId);
      const p2Socket = io.sockets.sockets.get(p2.socketId);
      if (p1Socket) p1Socket.join(room.id);
      if (p2Socket) p2Socket.join(room.id);

      // 发送匹配成功事件给双方
      const p1Payload: MatchFoundPayload = {
        roomId: room.id,
        opponentName: p2.name,
        firstTurn: room.currentTurn === p1.socketId,
        currentIdiom: room.currentIdiom,
        difficulty,
        playerSlots: room.slots[p1.socketId],
        opponentSlots: room.slots[p2.socketId],
      };
      const p2Payload: MatchFoundPayload = {
        roomId: room.id,
        opponentName: p1.name,
        firstTurn: room.currentTurn === p2.socketId,
        currentIdiom: room.currentIdiom,
        difficulty,
        playerSlots: room.slots[p2.socketId],
        opponentSlots: room.slots[p1.socketId],
      };

      if (p1Socket) p1Socket.emit('match:found', p1Payload);
      if (p2Socket) p2Socket.emit('match:found', p2Payload);

      console.log(`[Match] Room ${room.id} started. First: ${room.currentTurn === p1.socketId ? p1.name : p2.name}`);
    }
  });

  // ── 2. 玩家取消匹配 ──
  socket.on('match:cancel', () => {
    leaveQueue(socket.id);
    socket.emit('match:cancelled', { message: '已取消匹配' });
    console.log(`[Match] ${socket.id} cancelled`);
  });

  // ── 3. 玩家提交成语 ──
  socket.on('game:submit', (payload: GameSubmitPayload) => {
    const { roomId, idiom: idiomText } = payload;

    const room = getRoomBySocket(socket.id);
    if (!room || room.id !== roomId) {
      socket.emit('game:error', { message: '房间不存在或已结束' });
      return;
    }

    // 验证是否轮到该玩家
    if (room.currentTurn !== socket.id) {
      socket.emit('game:error', { message: '还没轮到你' });
      return;
    }

    // 服务端本地验证（前端也做了 AI 验证，服务端做宽容校验）
    const result = validateIdiomLocal(idiomText, room.currentIdiom);

    const opponentId = getOpponentId(room, socket.id);

    if (result.valid && result.idiomData) {
      // 接龙成功
      const idiomData: Idiom = result.idiomData.last
        ? result.idiomData
        : { text: idiomText, first: '', last: room.currentIdiom.last }; // 词库未收录，宽容处理

      const updatedRoom = advanceTurn(room, idiomData, socket.id);

      // 通知提交者：验证通过
      const submitResult: GameValidateResultPayload = {
        valid: true,
        idiomData,
        nextTurn: updatedRoom.currentTurn,
      };
      socket.emit('game:validate_result', submitResult);

      // 通知对手：对手出了什么
      const opponentNotify: GameOpponentSubmitPayload = {
        idiom: idiomData,
        valid: true,
      };
      const opponentSocket = io.sockets.sockets.get(opponentId);
      if (opponentSocket) opponentSocket.emit('game:opponent_submit', opponentNotify);

      // 广播游戏状态更新给双方
      socket.emit('game:state_update', buildStateUpdate(updatedRoom, socket.id));
      if (opponentSocket) opponentSocket.emit('game:state_update', buildStateUpdate(updatedRoom, opponentId));

    } else {
      // 接龙失败 → 对提交者执行轮盘赌
      const submitResult: GameValidateResultPayload = {
        valid: false,
        errorType: result.errorType ?? 'wrong-chain',
        nextTurn: socket.id, // 失败后先执行轮盘
      };
      socket.emit('game:validate_result', submitResult);

      // 执行轮盘赌
      _executeRouletteForPlayer(socket.id, room, 'wrong-chain');
    }
  });

  // ── 4. 玩家超时 ──
  socket.on('game:timeout', (payload: { roomId: string }) => {
    const room = getRoomBySocket(socket.id);
    if (!room || room.id !== payload.roomId) return;
    if (room.currentTurn !== socket.id) return;

    console.log(`[Game] Timeout: ${socket.id} in room ${room.id}`);
    _executeRouletteForPlayer(socket.id, room, 'timeout');
  });

  // ── 5. 断线处理 ──
  socket.on('disconnect', () => {
    console.log(`[Socket] Disconnected: ${socket.id}`);

    // 从匹配队列移除
    leaveQueue(socket.id);

    // 如果在房间中，通知对手
    const result = handleDisconnect(socket.id);
    if (result) {
      const { room, opponentId } = result;
      const opponentSocket = io.sockets.sockets.get(opponentId);
      if (opponentSocket) {
        const overPayload: GameOverPayload = {
          winner: 'you',
          reason: 'opponent-left',
          stats: {
            rounds: room.round,
            chainHistory: room.chainHistory,
          },
        };
        opponentSocket.emit('game:over', overPayload);
      }
    }
  });

  // ── 内部辅助：执行轮盘赌并广播结果 ──
  function _executeRouletteForPlayer(
    targetSocketId: string,
    room: ReturnType<typeof getRoomBySocket>,
    _reason: string
  ) {
    if (!room) return;

    const { updatedRoom, hit, chamberId } = executeRoulette(room, targetSocketId);
    const opponentId = getOpponentId(updatedRoom, targetSocketId);
    const opponentSocket = io.sockets.sockets.get(opponentId);
    const targetSocket = io.sockets.sockets.get(targetSocketId);

    // 给双方发轮盘赌结果（各自视角 target: 'you'/'opponent'）
    const rouletteForTarget: GameRoulettePayload = buildRoulettePayload(
      updatedRoom, targetSocketId, targetSocketId, hit, chamberId
    );
    const rouletteForOpponent: GameRoulettePayload = buildRoulettePayload(
      updatedRoom, opponentId, targetSocketId, hit, chamberId
    );

    if (targetSocket) targetSocket.emit('game:roulette', rouletteForTarget);
    if (opponentSocket) opponentSocket.emit('game:roulette', rouletteForOpponent);

    if (hit) {
      // 中弹 → 游戏结束
      const loserName = targetSocketId === room.player1.socketId
        ? room.player1.name
        : room.player2.name;
      console.log(`[Game] ${loserName} hit! Room ${room.id} over.`);

      // 给被打的人
      if (targetSocket) {
        const overPayload: GameOverPayload = {
          winner: 'opponent',
          reason: 'roulette',
          stats: { rounds: room.round, chainHistory: room.chainHistory },
        };
        targetSocket.emit('game:over', overPayload);
      }
      // 给对手（胜利者）
      if (opponentSocket) {
        const overPayload: GameOverPayload = {
          winner: 'you',
          reason: 'roulette',
          stats: { rounds: room.round, chainHistory: room.chainHistory },
        };
        opponentSocket.emit('game:over', overPayload);
      }

      deleteRoom(room.id);
    } else {
      // 侥幸存活 → 继续游戏，广播新状态
      if (targetSocket) targetSocket.emit('game:state_update', buildStateUpdate(updatedRoom, targetSocketId));
      if (opponentSocket) opponentSocket.emit('game:state_update', buildStateUpdate(updatedRoom, opponentId));
    }
  }
});

// ── 启动服务器 ──
httpServer.listen(PORT, () => {
  console.log(`\n🎮 成语死斗 联网服务器启动`);
  console.log(`   PORT: ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});
