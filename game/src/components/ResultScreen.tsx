import React, { useEffect, useState } from 'react';
import VideoScene from './VideoScene';

export interface GameStats {
  rounds: number;
  correctCount: number;
  wrongCount: number;
  isVictory: boolean;
  opponentName: string;
  chainHistory: string[]; // 成功接龙的成语列表
}

interface Props {
  stats: GameStats;
  onRetry: () => void;
  onHome: () => void;
  onlineEndReason?: 'roulette' | 'opponent-left';
}

const STORAGE_KEY = 'idiom_best_record';

export function loadBestRecord(): { rounds: number; accuracy: number } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveBestRecord(stats: GameStats) {
  const accuracy = stats.rounds === 0
    ? 0
    : Math.round((stats.correctCount / stats.rounds) * 100);
  const prev = loadBestRecord();
  if (!prev || stats.rounds > prev.rounds) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ rounds: stats.rounds, accuracy }));
  }
}

const ResultScreen: React.FC<Props> = ({ stats, onRetry, onHome, onlineEndReason }) => {
  const [newBest, setNewBest] = useState(false);

  useEffect(() => {
    const prev = loadBestRecord();
    if (!prev || stats.rounds > prev.rounds) {
      setNewBest(true);
    }
    saveBestRecord(stats);
  }, [stats]);

  const accuracy = stats.rounds === 0
    ? 0
    : Math.round((stats.correctCount / stats.rounds) * 100);

  return (
    <div className={`min-h-screen flex flex-col font-cn text-emerald-400 ${stats.isVictory ? 'bg-[#0a1410]' : 'bg-[#0d0606]'}`}>

      {/* 顶部 */}
      <div className="flex items-center justify-center px-4 py-2 border-b border-emerald-900/40 bg-black/50 shrink-0">
        <span className="font-pixel text-[8px] text-emerald-800 tracking-widest">
          — BATTLE RESULT —
        </span>
      </div>

      {/* 16:9 结果视频 */}
      <VideoScene event={stats.isVictory ? 'victory' : 'defeat'} />

      {/* 主体 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 gap-7">

        {/* 胜败大图 */}
        <div className="text-center animate-slide-up">
          {stats.isVictory ? (
            <>
              <div className="text-8xl mb-2 animate-bounce">🏆</div>
              <div className="text-4xl font-black text-yellow-400 tracking-widest animate-title-glow">
                胜 利
              </div>
              <div className="text-emerald-600 mt-2 text-sm">
                {onlineEndReason === 'opponent-left'
                  ? `${stats.opponentName} 断线逃跑了`
                  : `${stats.opponentName} 已被送进棺材`}
              </div>
            </>
          ) : (
            <>
              <div className="text-8xl mb-2">💀</div>
              <div className="text-4xl font-black text-red-500 tracking-widest">
                阵 亡
              </div>
              <div className="text-zinc-500 mt-2 text-sm">
                {onlineEndReason === 'opponent-left'
                  ? '对手已断线（算平局）'
                  : `被 ${stats.opponentName} 送走了`}
              </div>
            </>
          )}
        </div>

        {/* 新纪录提示 */}
        {newBest && (
          <div className="font-pixel text-[8px] text-yellow-500 border border-yellow-700 px-4 py-2 animate-blink tracking-widest">
            ★ NEW RECORD ★
          </div>
        )}

        {/* 统计数据 */}
        <div className="w-full max-w-sm border border-emerald-900/60 bg-black/30 divide-y divide-emerald-900/40">
          {[
            { label: '对战对手', value: stats.opponentName },
            { label: '存活回合', value: String(stats.rounds) },
            { label: '接龙成功', value: `${stats.correctCount} 次` },
            { label: '接龙失误', value: `${stats.wrongCount} 次`, danger: stats.wrongCount > 0 },
            { label: '接龙正确率', value: `${accuracy} %`, highlight: accuracy >= 80 },
          ].map(({ label, value, danger, highlight }) => (
            <div key={label} className="flex justify-between px-4 py-2.5 text-sm">
              <span className="text-emerald-700">{label}</span>
              <span className={`font-bold ${danger ? 'text-red-400' : highlight ? 'text-yellow-400' : 'text-emerald-300'}`}>
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* 接龙历史 */}
        {stats.chainHistory.length > 0 && (
          <div className="w-full max-w-sm">
            <div className="font-pixel text-[7px] text-emerald-800 mb-2">— 接龙记录 —</div>
            <div className="flex flex-wrap gap-1.5">
              {stats.chainHistory.map((text, i) => {
                const isReset = text.startsWith('[换词]');
                const display = isReset ? text.replace('[换词] ', '') : text;
                return (
                  <span
                    key={i}
                    className={`px-2 py-0.5 text-xs border ${
                      isReset
                        ? 'bg-yellow-900/20 border-yellow-900/50 text-yellow-700'
                        : 'bg-emerald-900/20 border-emerald-900/50 text-emerald-600'
                    }`}
                    title={isReset ? '轮盘赌后换词' : undefined}
                  >
                    {isReset && <span className="mr-1 opacity-60">🔄</span>}
                    {display}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* 按钮 */}
        <div className="w-full max-w-sm flex flex-col gap-3">
          <button
            onClick={onRetry}
            className="
              w-full py-3 px-6 text-base tracking-[0.2em] font-bold
              bg-[#0f2018] text-emerald-300 border-2 border-emerald-600
              hover:bg-emerald-900/30 hover:border-emerald-400
              active:scale-95 transition-all
              before:content-['▶_'] before:mr-1
            "
          >
            再来一局
          </button>
          <button
            onClick={onHome}
            className="
              w-full py-3 px-6 text-base tracking-[0.2em] font-bold
              bg-black text-zinc-500 border-2 border-zinc-800
              hover:bg-zinc-900 hover:border-zinc-600 hover:text-zinc-300
              active:scale-95 transition-all
            "
          >
            返回主菜单
          </button>
        </div>
      </div>

      {/* 底部 */}
      <div className="shrink-0 px-4 py-2 border-t border-emerald-900/40 bg-black/40 text-[7px] font-pixel text-emerald-900 text-center">
        ░ 成语死斗 · IDIOM DEATHMATCH ░
      </div>
    </div>
  );
};

export default ResultScreen;
