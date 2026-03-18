import React, { useRef, useEffect } from 'react';

// ── 视频资源映射 ──
// 将来把视频文件放到 public/videos/ 目录下，修改这里的路径即可
// 格式建议：16:9 的 mp4，分辨率 1280×720 或 1920×1080
export type VideoEvent =
  | 'idle'          // 待机 / 默认
  | 'thinking'      // AI思考中
  | 'correct'       // 接龙成功
  | 'wrong'         // 接龙失败 / 错误
  | 'timeout'       // 超时
  | 'roulette-spin' // 弹仓旋转
  | 'roulette-bang' // 开枪中弹
  | 'roulette-miss' // 开枪空仓
  | 'ai-killed'     // AI被击杀
  | 'victory'       // 胜利
  | 'defeat';       // 失败

// 视频文件路径表（都放在 public/videos/ 下，用相对路径）
// 没有视频文件时显示内置的像素占位动画
const VIDEO_MAP: Record<VideoEvent, string | null> = {
  'idle':           null,  // 替换为 '/videos/idle.mp4'
  'thinking':       null,  // 替换为 '/videos/thinking.mp4'
  'correct':        null,  // 替换为 '/videos/correct.mp4'
  'wrong':          null,  // 替换为 '/videos/wrong.mp4'
  'timeout':        null,  // 替换为 '/videos/timeout.mp4'
  'roulette-spin':  null,  // 替换为 '/videos/roulette-spin.mp4'
  'roulette-bang':  null,  // 替换为 '/videos/roulette-bang.mp4'
  'roulette-miss':  null,  // 替换为 '/videos/roulette-miss.mp4'
  'ai-killed':      null,  // 替换为 '/videos/ai-killed.mp4'
  'victory':        null,  // 替换为 '/videos/victory.mp4'
  'defeat':         null,  // 替换为 '/videos/defeat.mp4'
};

// 内置像素占位动画（无视频时显示）
const PIXEL_FALLBACK: Record<VideoEvent, { emoji: string; label: string; color: string; bg: string }> = {
  'idle':           { emoji: '🤖', label: 'STANDBY',      color: 'text-emerald-400', bg: 'from-emerald-950 to-black' },
  'thinking':       { emoji: '🧠', label: 'THINKING…',    color: 'text-yellow-400',  bg: 'from-yellow-950 to-black' },
  'correct':        { emoji: '✅', label: 'CHAIN OK!',    color: 'text-emerald-300', bg: 'from-emerald-900 to-black' },
  'wrong':          { emoji: '❌', label: 'CHAIN FAIL',   color: 'text-red-400',     bg: 'from-red-950 to-black' },
  'timeout':        { emoji: '⏰', label: 'TIMEOUT!',     color: 'text-orange-400',  bg: 'from-orange-950 to-black' },
  'roulette-spin':  { emoji: '🔫', label: 'SPINNING…',   color: 'text-zinc-300',    bg: 'from-zinc-900 to-black' },
  'roulette-bang':  { emoji: '💥', label: 'BANG!!!',      color: 'text-red-500',     bg: 'from-red-900 to-black' },
  'roulette-miss':  { emoji: '🌬️', label: 'CLICK…',       color: 'text-zinc-400',    bg: 'from-zinc-900 to-black' },
  'ai-killed':      { emoji: '💀', label: 'AI KILLED',    color: 'text-red-400',     bg: 'from-red-950 to-black' },
  'victory':        { emoji: '🏆', label: 'VICTORY!',     color: 'text-yellow-400',  bg: 'from-yellow-900 to-black' },
  'defeat':         { emoji: '☠️', label: 'DEFEATED',     color: 'text-zinc-400',    bg: 'from-zinc-900 to-black' },
};

interface Props {
  event: VideoEvent;
  loop?: boolean;
  className?: string;
}

const VideoScene: React.FC<Props> = ({ event, loop = true, className = '' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoSrc = VIDEO_MAP[event];
  const fallback = PIXEL_FALLBACK[event];

  // 当事件切换时，重新播放视频
  useEffect(() => {
    if (videoRef.current && videoSrc) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {/* 忽略自动播放限制 */});
    }
  }, [event, videoSrc]);

  return (
    <div className={`relative w-full overflow-hidden bg-black ${className}`}
         style={{ aspectRatio: '16/9' }}>

      {videoSrc ? (
        // ── 有视频：播放真实视频 ──
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          src={videoSrc}
          loop={loop}
          muted
          playsInline
          autoPlay
        />
      ) : (
        // ── 无视频：像素风占位动画 ──
        <div className={`absolute inset-0 bg-gradient-to-b ${fallback.bg} flex flex-col items-center justify-center gap-3`}>
          {/* 扫描线效果 */}
          <div className="absolute inset-0 pointer-events-none"
               style={{
                 backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.15) 3px, rgba(0,0,0,0.15) 4px)',
               }} />
          {/* 角落装饰 */}
          <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-current opacity-30" />
          <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-current opacity-30" />
          <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-current opacity-30" />
          <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-current opacity-30" />

          {/* 主内容 */}
          <div className="text-5xl animate-bounce" style={{ animationDuration: '1.5s' }}>
            {fallback.emoji}
          </div>
          <div className={`font-pixel text-[11px] tracking-[0.3em] ${fallback.color}`}>
            {fallback.label}
          </div>

          {/* 像素点阵装饰 */}
          <div className="flex gap-1.5 mt-1">
            {[0, 0.2, 0.4, 0.2, 0].map((d, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${fallback.color} animate-pulse opacity-60`}
                style={{ animationDelay: `${d}s` }}
              />
            ))}
          </div>

          {/* 左下角视频说明 */}
          <div className="absolute bottom-2 left-3 font-pixel text-[6px] text-zinc-700 tracking-widest">
            VIDEO: {event.toUpperCase()} · REPLACE WITH /videos/{event}.mp4
          </div>
        </div>
      )}

      {/* 视频覆盖的像素边框 */}
      <div className="absolute inset-0 pointer-events-none"
           style={{ boxShadow: 'inset 0 0 0 1px rgba(52,211,153,0.1)' }} />
    </div>
  );
};

export default VideoScene;
export { VIDEO_MAP };
