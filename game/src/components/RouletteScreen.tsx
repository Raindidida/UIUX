import React, { useState, useEffect, useRef } from 'react';
import { BulletSlot } from '../App';

export type RouletteTarget = 'player' | 'ai';

interface Props {
  target: RouletteTarget;
  opponentName: string;
  presetHit?: boolean;           // App预先计算好的结果
  presetChamber?: number;        // App预先计算好的弹仓位置
  playerSlots?: BulletSlot[];
  aiSlots?: BulletSlot[];
  onResult: (survived: boolean) => void;
}

const BULLET_POSITIONS = [1, 4]; // 6发弹仓，2颗真弹

type Phase = 'spinning' | 'countdown' | 'fire' | 'result';

const RouletteScreen: React.FC<Props> = ({ target, opponentName, presetHit, presetChamber, playerSlots, aiSlots, onResult }) => {
  const [phase, setPhase] = useState<Phase>('spinning');
  const [chamber] = useState(() => presetChamber ?? Math.floor(Math.random() * 6));
  const [countdown, setCountdown] = useState(3);
  const [isShot, setIsShot] = useState(false);
  const [gunshotFlash, setGunshotFlash] = useState(false);
  const firedRef = useRef(false);

  const isPlayer = target === 'player';
  const shot = presetHit ?? BULLET_POSITIONS.includes(chamber);

  // 阶段1：弹仓旋转 1.2s
  useEffect(() => {
    const t = setTimeout(() => setPhase('countdown'), 1200);
    return () => clearTimeout(t);
  }, []);

  // 阶段2：倒计时 3→0，结束后自动开枪
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown <= 0) {
      fireShotOnce();
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, countdown]);

  const fireShotOnce = () => {
    if (firedRef.current) return;
    firedRef.current = true;
    setPhase('fire');
    setIsShot(shot);
    setTimeout(() => setGunshotFlash(true), 100);
    setTimeout(() => setGunshotFlash(false), 500);
    setTimeout(() => {
      setPhase('result');
      setTimeout(() => onResult(!shot), 1800);
    }, 1600);
  };

  // 弹仓格子（spinning 阶段隐藏，result 阶段揭示）
  const chambers = Array.from({ length: 6 }, (_, i) => ({
    hasBullet: BULLET_POSITIONS.includes(i),
    isCurrent: i === chamber,
  }));

  return (
    <div className="min-h-screen bg-[#050505] text-emerald-400 flex flex-col font-cn select-none">

      {/* 枪击闪光 */}
      {gunshotFlash && (
        <div className="fixed inset-0 z-[300] bg-white/90 pointer-events-none" />
      )}
      {/* 中弹红屏 */}
      {phase === 'result' && isShot && (
        <div className="fixed inset-0 z-[299] bg-red-900/60 pointer-events-none animate-flash-bang" />
      )}

      {/* 顶部警示栏 */}
      <div className="flex items-center justify-center px-4 py-2 border-b border-red-900/50 bg-black shrink-0">
        <span className="font-pixel text-[8px] text-red-600 tracking-widest animate-blink">
          ⚠ ROULETTE PUNISHMENT ⚠
        </span>
      </div>

      {/* 主画面：枪口视角插画 */}
      <div className="flex-1 flex flex-col items-center justify-between px-4 py-4 gap-4">

        {/* 受罚者标签 */}
        <div className="text-center">
          <div className="font-pixel text-[7px] text-zinc-600 mb-1">接受惩罚</div>
          <div className={`text-xl font-bold tracking-widest ${isPlayer ? 'text-red-400' : 'text-yellow-400'}`}>
            {isPlayer ? '💀 你' : `🤖 ${opponentName}`}
          </div>
        </div>

        {/* ─── 枪口插画区域 ─── */}
        <div className="relative w-full max-w-sm flex items-center justify-center">
          <GunBarrelIllustration
            phase={phase}
            countdown={countdown}
            isShot={isShot}
            isPlayer={isPlayer}
          />
        </div>

        {/* 弹仓状态 */}
        <div className="flex flex-col items-center gap-2">
          <div className="font-pixel text-[7px] text-zinc-700">本次弹仓</div>
          <div className="flex gap-2">
            {chambers.map(({ hasBullet, isCurrent }, i) => (
              <div
                key={i}
                className={`
                  w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold
                  transition-all duration-200
                  ${phase === 'spinning' ? 'animate-cylinder-spin opacity-50' : ''}
                  ${isCurrent && phase !== 'result'
                    ? 'border-yellow-500 bg-yellow-900/30 scale-110 shadow-[0_0_8px_rgba(234,179,8,0.6)]'
                    : 'border-zinc-800 bg-zinc-950'
                  }
                  ${phase === 'result' && hasBullet ? 'border-red-700 bg-red-900/30' : ''}
                `}
              >
                {phase === 'result' ? (hasBullet ? '🔴' : '·') : (isCurrent ? '▶' : '·')}
              </div>
            ))}
          </div>
          <div className="font-pixel text-[6px] text-zinc-800">6发弹仓 · 2颗真弹</div>
        </div>

        {/* 双方累计子弹槽 */}
        {(playerSlots || aiSlots) && (
          <div className="w-full max-w-xs flex flex-col gap-2 border border-zinc-900 bg-black/40 px-4 py-3">
            <div className="font-pixel text-[6px] text-zinc-700 text-center mb-1">累计开枪记录</div>
            {playerSlots && (
              <div className="flex items-center gap-2">
                <span className="font-pixel text-[6px] text-emerald-800 w-12 shrink-0">1P 你</span>
                <div className="flex gap-1">
                  {playerSlots.map((s, i) => (
                    <div key={i} className={`
                      w-5 h-5 rounded-full border flex items-center justify-center
                      ${s.fired
                        ? s.hasBullet ? 'bg-red-900/70 border-red-600' : 'bg-zinc-900/60 border-zinc-700 opacity-50'
                        : 'bg-emerald-900/20 border-emerald-800'
                      }
                    `}>
                      <span className="text-[7px]">
                        {s.fired ? (s.hasBullet ? '✕' : '·') : '○'}
                      </span>
                    </div>
                  ))}
                </div>
                <span className="font-pixel text-[6px] text-emerald-900">
                  剩{playerSlots.filter(s => !s.fired).length}
                </span>
              </div>
            )}
            {aiSlots && (
              <div className="flex items-center gap-2">
                <span className="font-pixel text-[6px] text-red-900 w-12 shrink-0">2P AI</span>
                <div className="flex gap-1">
                  {aiSlots.map((s, i) => (
                    <div key={i} className={`
                      w-5 h-5 rounded-full border flex items-center justify-center
                      ${s.fired
                        ? s.hasBullet ? 'bg-red-900/70 border-red-600' : 'bg-zinc-900/60 border-zinc-700 opacity-50'
                        : 'bg-red-900/10 border-red-900/40'
                      }
                    `}>
                      <span className="text-[7px]">
                        {s.fired ? (s.hasBullet ? '✕' : '·') : '○'}
                      </span>
                    </div>
                  ))}
                </div>
                <span className="font-pixel text-[6px] text-red-900">
                  剩{aiSlots.filter(s => !s.fired).length}
                </span>
              </div>
            )}
          </div>
        )}

        {/* 结果文字 */}
        {phase === 'result' && (
          <div className="text-center animate-slide-up space-y-2">
            {isShot ? (
              <>
                <div className="text-red-400 text-3xl font-black tracking-widest animate-screen-shake">
                  {isPlayer ? '💥 你中弹了！' : `💥 ${opponentName} 中弹！`}
                </div>
                <div className="text-zinc-500 text-sm">{isPlayer ? '游戏结束' : '击杀成功！'}</div>
              </>
            ) : (
              <>
                <div className="text-emerald-300 text-2xl font-black tracking-widest">
                  {isPlayer ? '🕳 空枪，捡了一条命' : `🕳 ${opponentName} 侥幸存活`}
                </div>
                <div className="text-zinc-500 text-sm">
                  {isPlayer ? '把同一个词给对方接…' : '继续接龙…'}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* 底部 */}
      <div className="shrink-0 px-4 py-2 border-t border-zinc-900 bg-black font-pixel text-[6px] text-zinc-900 text-center">
        ░ 命运轮盘 · 6发弹仓 · 2颗真弹 ░
      </div>
    </div>
  );
};

// ─── 枪口插画组件 ───
const GunBarrelIllustration: React.FC<{
  phase: Phase;
  countdown: number;
  isShot: boolean;
  isPlayer: boolean;
}> = ({ phase, countdown, isShot }) => {
  const isCountdown = phase === 'countdown';
  const isFire = phase === 'fire';
  const isResult = phase === 'result';

  // 枪口对准画面的像素风插画：用 CSS box-shadow 绘制
  return (
    <div className="flex flex-col items-center gap-6 w-full">

      {/* 枪管插画 */}
      <div
        className={`
          relative flex flex-col items-center
          transition-all duration-150
          ${isFire ? 'scale-110' : 'scale-100'}
        `}
      >
        {/* 枪口光晕 */}
        {isCountdown && (
          <div
            className="absolute -top-4 w-16 h-16 rounded-full opacity-60 animate-pulse"
            style={{
              background: `radial-gradient(circle, rgba(220,38,38,${0.3 + (3 - countdown) * 0.15}) 0%, transparent 70%)`,
            }}
          />
        )}
        {isFire && !isShot && (
          <div className="absolute -top-6 w-24 h-24 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(255,200,0,0.7) 0%, transparent 70%)' }} />
        )}

        {/* 枪口正视图：像素风格 */}
        <svg
          width="160" height="200"
          viewBox="0 0 80 100"
          className={`
            ${isCountdown ? 'drop-shadow-[0_0_12px_rgba(220,38,38,0.8)]' : ''}
            ${isFire && isShot ? 'drop-shadow-[0_0_20px_rgba(255,100,0,1)]' : ''}
          `}
          style={{ imageRendering: 'pixelated' }}
        >
          {/* 枪管外圈 */}
          <rect x="28" y="0" width="24" height="60" rx="2" fill="#1a1a1a" stroke="#333" strokeWidth="1"/>
          {/* 枪口内膛 */}
          <rect x="33" y="2" width="14" height="56" rx="1" fill="#0a0a0a"/>
          {/* 膛线（六条） */}
          {[35, 37, 39, 41, 43, 45].map(x => (
            <rect key={x} x={x} y="4" width="1" height="50" fill="#111" opacity="0.6"/>
          ))}
          {/* 枪管高光 */}
          <rect x="29" y="0" width="3" height="60" rx="1" fill="#2a2a2a" opacity="0.5"/>

          {/* 准星 */}
          <rect x="38" y="62" width="4" height="8" fill="#c0c0c0"/>
          <rect x="36" y="64" width="8" height="2" fill="#c0c0c0"/>

          {/* 枪架/护手 */}
          <rect x="20" y="58" width="40" height="16" rx="2" fill="#222" stroke="#333" strokeWidth="1"/>
          <rect x="22" y="60" width="36" height="12" rx="1" fill="#1a1a1a"/>

          {/* 枪把 */}
          <rect x="30" y="74" width="20" height="26" rx="3" fill="#1c1008" stroke="#2a1a0a" strokeWidth="1"/>
          <rect x="32" y="76" width="16" height="22" rx="2" fill="#170e04" opacity="0.8"/>
          {/* 木纹 */}
          {[78,82,86,90,94].map(y => (
            <rect key={y} x="32" y={y} width="16" height="1" fill="#221508" opacity="0.6"/>
          ))}

          {/* 倒计时：枪口内红光 */}
          {isCountdown && (
            <circle cx="40" cy="30" r={6 + (3 - countdown) * 3}
              fill={`rgba(220,38,38,${0.2 + (3 - countdown) * 0.15})`} />
          )}
          {/* 开枪：枪口火焰 */}
          {isFire && !isShot && (
            <>
              <circle cx="40" cy="-4" r="8" fill="rgba(255,180,0,0.9)"/>
              <circle cx="40" cy="-8" r="5" fill="rgba(255,240,0,0.8)"/>
              <circle cx="40" cy="-2" r="10" fill="rgba(255,100,0,0.4)"/>
            </>
          )}
        </svg>
      </div>

      {/* 倒计时显示 */}
      {isCountdown && (
        <div className="text-center space-y-1">
          <div className="font-pixel text-[8px] text-zinc-500 tracking-widest">自动开枪倒计时</div>
          <div
            className={`
              font-pixel text-5xl font-black tabular-nums
              ${countdown <= 1 ? 'text-red-500 animate-blink' : countdown <= 2 ? 'text-orange-400' : 'text-yellow-400'}
            `}
          >
            {countdown}
          </div>
        </div>
      )}

      {phase === 'spinning' && (
        <div className="font-pixel text-[8px] text-zinc-600 animate-blink tracking-widest">
          弹仓旋转中…
        </div>
      )}

      {isFire && (
        <div className={`font-pixel text-[10px] font-black tracking-widest animate-blink
          ${isShot ? 'text-red-500' : 'text-emerald-400'}`}>
          {isShot ? '砰！' : '咔…（空枪）'}
        </div>
      )}
    </div>
  );
};

export default RouletteScreen;
