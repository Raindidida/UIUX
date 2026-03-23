import React, { useEffect, useRef, useState } from 'react';

// ── 视频事件类型 ──────────────────────────────────────────────
export type VideoEvent =
  | 'idle'                  // 待机 / 等待对方
  | 'thinking'              // 同 idle（对手思考中）
  | 'correct'               // 玩家成语提交成功
  | 'wrong'                 // 输入错误
  | 'timeout'               // 超时（同错误）
  | 'roulette-spin'         // 轮盘旋转等待
  | 'roulette-bang-player'  // 判定：玩家中枪死亡
  | 'roulette-miss-player'  // 判定：玩家轮盘没有中枪
  | 'roulette-bang-opponent'// 对手判定：中枪死亡（玩家胜）
  | 'roulette-miss-opponent'// 对手判定：没有中枪（对手存活）
  | 'victory'               // 胜利（重用对手死亡视频）
  | 'defeat';               // 失败（重用自己死亡视频）

// ── 视频文件路径映射（public/videos/ 目录）────────────────────
export const VIDEO_MAP: Record<VideoEvent, string | null> = {
  'idle':                   '/videos/idle.mp4',
  'thinking':               '/videos/idle.mp4',
  'correct':                '/videos/correct.mp4',
  'wrong':                  '/videos/wrong.mp4',
  'timeout':                '/videos/wrong.mp4',
  'roulette-spin':          '/videos/idle.mp4',
  'roulette-bang-player':   '/videos/roulette-bang-player.mp4',
  'roulette-miss-player':   '/videos/roulette-miss-player.mp4',
  'roulette-bang-opponent': '/videos/roulette-bang-opponent.mp4',
  'roulette-miss-opponent': '/videos/roulette-miss-opponent.mp4',
  'victory':                '/videos/roulette-bang-opponent.mp4',
  'defeat':                 '/videos/roulette-bang-player.mp4',
};

// ── 是否循环播放 ──────────────────────────────────────────────
const LOOP_MAP: Record<VideoEvent, boolean> = {
  'idle':                   true,
  'thinking':               true,
  'correct':                false,
  'wrong':                  false,
  'timeout':                false,
  'roulette-spin':          true,
  'roulette-bang-player':   false,
  'roulette-miss-player':   false,
  'roulette-bang-opponent': false,
  'roulette-miss-opponent': false,
  'victory':                false,
  'defeat':                 false,
};

// ── 无视频时的像素风占位 ──────────────────────────────────────
const PIXEL_FALLBACK: Record<VideoEvent, {
  emoji: string; label: string; color: string; bg: string;
}> = {
  'idle':                   { emoji: '🤖', label: 'STANDBY',       color: 'text-emerald-400', bg: 'from-emerald-950 to-black' },
  'thinking':               { emoji: '🧠', label: 'THINKING…',     color: 'text-yellow-400',  bg: 'from-yellow-950 to-black' },
  'correct':                { emoji: '✅', label: 'CHAIN OK!',     color: 'text-emerald-300', bg: 'from-emerald-900 to-black' },
  'wrong':                  { emoji: '❌', label: 'CHAIN FAIL',    color: 'text-red-400',     bg: 'from-red-950 to-black' },
  'timeout':                { emoji: '⏰', label: 'TIMEOUT!',      color: 'text-orange-400',  bg: 'from-orange-950 to-black' },
  'roulette-spin':          { emoji: '🔫', label: 'SPINNING…',    color: 'text-zinc-300',    bg: 'from-zinc-900 to-black' },
  'roulette-bang-player':   { emoji: '💥', label: 'YOU GOT HIT!', color: 'text-red-500',     bg: 'from-red-900 to-black' },
  'roulette-miss-player':   { emoji: '🌬️', label: 'CLOSE CALL…',  color: 'text-zinc-400',    bg: 'from-zinc-900 to-black' },
  'roulette-bang-opponent': { emoji: '🎯', label: 'ENEMY DOWN!',  color: 'text-yellow-400',  bg: 'from-yellow-900 to-black' },
  'roulette-miss-opponent': { emoji: '😤', label: 'ENEMY LIVES',  color: 'text-orange-400',  bg: 'from-orange-950 to-black' },
  'victory':                { emoji: '🏆', label: 'VICTORY!',      color: 'text-yellow-400',  bg: 'from-yellow-900 to-black' },
  'defeat':                 { emoji: '☠️', label: 'DEFEATED',      color: 'text-zinc-400',    bg: 'from-zinc-900 to-black' },
};

// ── 淡入淡出时长（ms）─────────────────────────────────────────
const FADE_MS = 400;

interface Props {
  event: VideoEvent;
  className?: string;
}

/**
 * 双缓冲视频播放器
 * - 始终保持两个 <video> 元素（A / B 交替使用）
 * - 切换时：将新视频加载到不可见的那个槽，开始播放后交换 opacity
 * - CSS transition 实现无黑帧的淡入淡出
 */
const VideoScene: React.FC<Props> = ({ event, className = '' }) => {
  const refA = useRef<HTMLVideoElement>(null);
  const refB = useRef<HTMLVideoElement>(null);

  // 当前哪个槽在前台（opacity 1）
  const [activeIsA, setActiveIsA] = useState(true);

  // 追踪上一个 event，避免初始化时触发切换
  const prevEventRef = useRef(event);

  // 延迟清理旧槽的计时器
  const cleanupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 是否显示像素占位（无视频文件时）
  const [showFallback, setShowFallback] = useState(!VIDEO_MAP[event]);

  // ── 挂载时初始化 slot A ───────────────────────────────────
  useEffect(() => {
    const src = VIDEO_MAP[event];
    if (src && refA.current) {
      refA.current.src = src;
      refA.current.loop = LOOP_MAP[event];
      refA.current.load();
      refA.current.play().catch(() => {/* 浏览器自动播放策略 */});
      setShowFallback(false);
    } else {
      setShowFallback(true);
    }
    prevEventRef.current = event;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── event 变化时：加载新视频 + 淡入淡出切换 ─────────────────
  useEffect(() => {
    if (event === prevEventRef.current) return;
    prevEventRef.current = event;

    const newSrc = VIDEO_MAP[event];
    const newLoop = LOOP_MAP[event];

    // 取消上一次尚未执行的清理
    if (cleanupTimerRef.current) clearTimeout(cleanupTimerRef.current);

    // 确定哪个槽是"后台"（即将载入新内容）
    const isCurrentA = activeIsA;
    const stagingRef = isCurrentA ? refB : refA;

    if (newSrc && stagingRef.current) {
      // 将新视频写入后台槽并开始播放
      stagingRef.current.src = newSrc;
      stagingRef.current.loop = newLoop;
      stagingRef.current.load();
      stagingRef.current.play().catch(() => {});
      setShowFallback(false);
    } else {
      if (stagingRef.current) {
        stagingRef.current.src = '';
      }
      if (!newSrc) setShowFallback(true);
    }

    // 下一帧触发 CSS 过渡（opacity 切换）
    requestAnimationFrame(() => {
      setActiveIsA(!isCurrentA);

      // 过渡完成后，清除旧槽资源
      cleanupTimerRef.current = setTimeout(() => {
        const oldRef = isCurrentA ? refA : refB;
        if (oldRef.current) {
          oldRef.current.pause();
          oldRef.current.removeAttribute('src');
          oldRef.current.load();
        }
      }, FADE_MS + 150);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);

  // ── 通用视频样式（仅 opacity 做过渡）────────────────────────
  const slotStyle = (isActive: boolean): React.CSSProperties => ({
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    opacity: isActive ? 1 : 0,
    transition: `opacity ${FADE_MS}ms ease-in-out`,
    zIndex: isActive ? 2 : 1,
  });

  const fallback = PIXEL_FALLBACK[event];

  return (
    <div
      className={`relative overflow-hidden bg-black ${className}`}
      style={{ aspectRatio: '16 / 9' }}
    >
      {/* 像素占位（在两个视频层之下，z-index 0） */}
      {showFallback && (
        <div
          className={`absolute inset-0 z-0 bg-gradient-to-b ${fallback.bg}
            flex flex-col items-center justify-center gap-3`}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.15) 3px, rgba(0,0,0,0.15) 4px)',
            }}
          />
          {/* 四角装饰 */}
          <div className="absolute top-2 left-2  w-5 h-5 border-t-2 border-l-2 border-current opacity-30" />
          <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-current opacity-30" />
          <div className="absolute bottom-2 left-2  w-5 h-5 border-b-2 border-l-2 border-current opacity-30" />
          <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-current opacity-30" />
          {/* 图标 + 标签 */}
          <div className="text-5xl animate-bounce" style={{ animationDuration: '1.5s' }}>
            {fallback.emoji}
          </div>
          <div className={`font-pixel text-[11px] tracking-[0.3em] ${fallback.color}`}>
            {fallback.label}
          </div>
          <div className="flex gap-1.5 mt-1">
            {[0, 0.2, 0.4, 0.2, 0].map((d, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${fallback.color} animate-pulse opacity-60`}
                style={{ animationDelay: `${d}s` }}
              />
            ))}
          </div>
          <div className="absolute bottom-2 left-3 font-pixel text-[6px] text-zinc-700 tracking-widest">
            VIDEO · {event.toUpperCase()}
          </div>
        </div>
      )}

      {/* Slot A */}
      <video ref={refA} muted playsInline style={slotStyle(activeIsA)} />

      {/* Slot B */}
      <video ref={refB} muted playsInline style={slotStyle(!activeIsA)} />

      {/* 内边框点缀 */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{ boxShadow: 'inset 0 0 0 1px rgba(52,211,153,0.08)' }}
      />
    </div>
  );
};

export default VideoScene;
