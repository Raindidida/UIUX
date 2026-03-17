import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, X } from 'lucide-react';
import { Difficulty } from './HomeScreen';
import {
  onQueueStatus,
  onConnectError,
  onDisconnect as onSocketDisconnect,
} from '../socket/socketClient';

interface Props {
  playerName: string;
  difficulty: Difficulty;
  onCancel: () => void;
}

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: '新手（40秒）',
  normal: '标准（20秒）',
  hard: '进阶（30秒）',
};

const WAITING_MESSAGES = [
  '扫描成语高手中…',
  '匹配旗鼓相当的对手…',
  '召唤文字战士…',
  '正在寻找接龙挑战者…',
  '对手即将到来…',
];

const MatchmakingScreen: React.FC<Props> = ({ playerName, difficulty, onCancel }) => {
  const [waitingSeconds, setWaitingSeconds] = useState(0);
  const [waitingMsg, setWaitingMsg] = useState(WAITING_MESSAGES[0]);
  const [totalWaiting, setTotalWaiting] = useState(0);
  const [dotCount, setDotCount] = useState(1);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [frame, setFrame] = useState(0); // 像素动画帧

  // 等待秒数计时
  useEffect(() => {
    const t = setInterval(() => {
      setWaitingSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // 等待提示文字轮播
  useEffect(() => {
    const t = setInterval(() => {
      setWaitingMsg(WAITING_MESSAGES[Math.floor(Math.random() * WAITING_MESSAGES.length)]);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  // 省略号动画
  useEffect(() => {
    const t = setInterval(() => {
      setDotCount(d => (d % 3) + 1);
    }, 500);
    return () => clearInterval(t);
  }, []);

  // 像素动画帧
  useEffect(() => {
    const t = setInterval(() => {
      setFrame(f => (f + 1) % 4);
    }, 400);
    return () => clearInterval(t);
  }, []);

  // 监听队列状态更新
  useEffect(() => {
    const off = onQueueStatus(data => {
      setTotalWaiting(data.totalWaiting);
    });
    return off;
  }, []);

  // 监听连接错误
  useEffect(() => {
    const off1 = onConnectError(err => {
      setConnectionError(`连接失败：${err.message}`);
    });
    const off2 = onSocketDisconnect(reason => {
      if (reason !== 'io client disconnect') {
        setConnectionError('与服务器的连接已断开');
      }
    });
    return () => { off1(); off2(); };
  }, []);

  // 像素风战士动画（纯文字 ASCII 艺术）
  const pixelFrames = [
    ['  ⚔ ·  ·  · ⚔ '],
    ['  · ⚔ ·  ⚔ ·  '],
    ['  ·  · ⚔ ·  ·  '],
    ['  ⚔ ·  ·  · ⚔ '],
  ];

  const dots = '.'.repeat(dotCount);

  return (
    <div className="min-h-screen bg-[#0a0a12] text-violet-300 flex flex-col items-center justify-center font-cn select-none px-6">

      {/* 顶部状态栏 */}
      <div className="fixed top-0 left-0 right-0 flex items-center justify-between px-4 py-2 border-b border-violet-900/40 bg-black/60 text-[9px] font-pixel text-violet-800">
        <span>ONLINE MATCHMAKING</span>
        <div className="flex items-center gap-1.5">
          {connectionError ? (
            <WifiOff size={10} className="text-red-500" />
          ) : (
            <Wifi size={10} className="text-violet-500 animate-pulse" />
          )}
          <span>{connectionError ? 'DISCONNECTED' : 'CONNECTED'}</span>
        </div>
        <span className="animate-blink">█</span>
      </div>

      {/* 主体内容 */}
      <div className="flex flex-col items-center gap-8 w-full max-w-sm">

        {/* 玩家信息卡 */}
        <div className="border border-violet-800/60 bg-violet-950/20 px-6 py-4 w-full text-center">
          <div className="font-pixel text-[7px] text-violet-700 tracking-widest mb-2">PLAYER CARD</div>
          <div className="text-2xl font-bold text-violet-200 tracking-wider">{playerName}</div>
          <div className="font-pixel text-[8px] text-violet-600 mt-1">
            {DIFFICULTY_LABEL[difficulty]}
          </div>
        </div>

        {/* 像素动画区 */}
        <div className="flex flex-col items-center gap-2">
          {/* 对战动画 */}
          <div className="flex items-center gap-6 text-4xl">
            <span className={frame % 2 === 0 ? 'text-emerald-400' : 'text-emerald-300'}>🧙</span>
            <div className="flex flex-col items-center">
              <span className="font-pixel text-[8px] text-violet-600">{pixelFrames[frame][0]}</span>
              <span className="font-pixel text-[10px] text-violet-500 mt-1">VS</span>
            </div>
            <span className={`text-4xl ${frame % 2 === 0 ? 'opacity-40' : 'opacity-70'} text-zinc-500`}>
              ❓
            </span>
          </div>

          {/* 旋转等待指示器 */}
          <div className="flex gap-1.5 mt-2">
            {[0, 1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-violet-500 animate-bounce"
                style={{ animationDelay: `${i * 0.12}s` }}
              />
            ))}
          </div>
        </div>

        {/* 等待状态 */}
        <div className="flex flex-col items-center gap-2 w-full">
          {connectionError ? (
            <div className="border border-red-800/60 bg-red-950/20 px-4 py-3 text-center w-full">
              <div className="font-pixel text-[8px] text-red-500 mb-1">CONNECTION ERROR</div>
              <div className="text-sm text-red-400">{connectionError}</div>
            </div>
          ) : (
            <>
              <div className="font-pixel text-[9px] text-violet-500 tracking-widest">
                {waitingMsg}{dots}
              </div>
              <div className="flex items-center gap-6 text-sm text-violet-700">
                <span>等待 <span className="text-violet-400 font-bold tabular-nums">{waitingSeconds}s</span></span>
                <span>·</span>
                <span>在线等待 <span className="text-violet-400 font-bold tabular-nums">{totalWaiting}</span> 人</span>
              </div>
            </>
          )}
        </div>

        {/* 难度标签 */}
        <div className="border border-violet-900/40 bg-black/20 px-4 py-2 w-full text-center text-xs text-violet-800">
          <span className="text-violet-600">匹配难度：</span>
          <span className="text-violet-400 font-bold">{DIFFICULTY_LABEL[difficulty]}</span>
          <span className="text-violet-600">  ·  </span>
          <span className="text-violet-700">仅与相同难度玩家匹配</span>
        </div>

        {/* 等待时提示 */}
        {waitingSeconds >= 15 && !connectionError && (
          <div className="text-xs text-violet-800 text-center animate-fade-in">
            等待时间较长？也许没有同难度玩家在线，<br />
            <button
              onClick={onCancel}
              className="text-violet-600 underline mt-1 hover:text-violet-400"
            >
              切换难度重新匹配
            </button>
          </div>
        )}

        {/* 取消按钮 */}
        <button
          onClick={onCancel}
          className="
            flex items-center gap-2 px-6 py-3
            border border-zinc-700 bg-black/30 text-zinc-500
            hover:border-zinc-500 hover:text-zinc-300
            active:scale-95 transition-all duration-100
            font-cn tracking-wider text-sm
          "
        >
          <X size={14} />
          取消匹配
        </button>
      </div>

      {/* 底部装饰栏 */}
      <div className="fixed bottom-0 left-0 right-0 flex items-center justify-center px-4 py-2 border-t border-violet-900/30 bg-black/60 text-[8px] font-pixel text-violet-900">
        <span>◈ 找到对手后自动开始 · 准备好接受文字挑战了吗？◈</span>
      </div>
    </div>
  );
};

export default MatchmakingScreen;
