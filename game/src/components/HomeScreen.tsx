import React, { useEffect, useState } from 'react';
import { Swords, Timer, Wifi } from 'lucide-react';

export type Difficulty = 'easy' | 'normal' | 'hard';

export const DIFFICULTY_CONFIG: Record<Difficulty, {
  label: string;
  seconds: number;
  color: string;
  borderColor: string;
  bgColor: string;
  glowColor: string;
  desc: string;
  tag: string;
}> = {
  easy:   { label: '40 秒', seconds: 40, color: 'text-sky-300',    borderColor: 'border-sky-700',    bgColor: 'bg-sky-900/20',    glowColor: 'rgba(56,189,248,0.25)',  desc: '适合入门，从容作答',   tag: '新手' },
  normal: { label: '20 秒', seconds: 20, color: 'text-emerald-300', borderColor: 'border-emerald-600', bgColor: 'bg-emerald-900/20', glowColor: 'rgba(52,211,153,0.25)',  desc: '标准模式，默认推荐',   tag: '标准' },
  hard:   { label: '30 秒', seconds: 30, color: 'text-orange-300',  borderColor: 'border-orange-700',  bgColor: 'bg-orange-900/20',  glowColor: 'rgba(251,146,60,0.25)',  desc: '适中压力，思考更从容', tag: '进阶' },
};

interface Props {
  onStart: (difficulty: Difficulty) => void;
  onOnlineMatch: (playerName: string, difficulty: Difficulty) => void;
  bestRecord: { rounds: number; accuracy: number } | null;
}

const HomeScreen: React.FC<Props> = ({ onStart, onOnlineMatch, bestRecord }) => {
  const [dateStr, setDateStr] = useState('');
  const [selected, setSelected] = useState<Difficulty>('normal');
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('idiom_player_name') ?? '');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      setDateStr(
        `DATE ${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} [${days[now.getDay()]}]  ` +
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const difficulties: Difficulty[] = ['easy', 'normal', 'hard'];

  const handleOnlineMatch = () => {
    const name = playerName.trim() || '匿名侠客';
    localStorage.setItem('idiom_player_name', name);
    onOnlineMatch(name, selected);
  };

  return (
    <div className="min-h-screen bg-[#0a1410] text-emerald-400 flex flex-col font-cn select-none">
      {/* ── 顶部状态栏 ── */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-emerald-900/50 bg-black/40 text-[10px] font-pixel text-emerald-700 shrink-0">
        <span>{dateStr}</span>
        <div className="overflow-hidden flex-1 mx-6">
          <span className="inline-block animate-ticker whitespace-nowrap text-emerald-800">
            ※ 成语死斗 · IDIOM DEATHMATCH &nbsp;&nbsp;&nbsp; 答不出来？扣下扳机吧 &nbsp;&nbsp;&nbsp; 6发弹仓，2发子弹，命由天定 &nbsp;&nbsp;&nbsp; 成语接龙，末字同音 &nbsp;&nbsp;&nbsp;
          </span>
        </div>
        <span className="animate-blink">█</span>
      </div>

      {/* ── 主体 ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-6">

        {/* 标题 */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-4">
            <span className="text-emerald-600 text-3xl">☠</span>
            <h1
              className="text-5xl font-bold tracking-[0.15em] animate-title-glow text-emerald-300"
              style={{ textShadow: '0 0 20px rgba(110,231,183,0.5)' }}
            >
              成语死斗
            </h1>
            <span className="text-emerald-600 text-3xl">☠</span>
          </div>
          <p className="font-pixel text-[9px] text-emerald-700 tracking-widest">
            IDIOM  DEATHMATCH
          </p>
          <p className="text-sm text-emerald-600 tracking-widest">
            —— 文以载死，字以定命 ——
          </p>
        </div>

        {/* 分隔线 */}
        <div className="w-full max-w-lg flex items-center gap-3">
          <div className="flex-1 h-px bg-emerald-900/60" />
          <Swords size={14} className="text-emerald-700" />
          <div className="flex-1 h-px bg-emerald-900/60" />
        </div>

        {/* ── 难度选择 ── */}
        <div className="w-full max-w-sm flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-1">
            <Timer size={12} className="text-emerald-700" />
            <span className="font-pixel text-[8px] text-emerald-700 tracking-widest">SELECT DIFFICULTY</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {difficulties.map(d => {
              const cfg = DIFFICULTY_CONFIG[d];
              const isSelected = selected === d;
              return (
                <button
                  key={d}
                  onClick={() => setSelected(d)}
                  className={`
                    flex flex-col items-center gap-1.5 py-3 px-2
                    border-2 transition-all duration-150 active:scale-95
                    ${isSelected
                      ? `${cfg.borderColor} ${cfg.bgColor} ${cfg.color}`
                      : 'border-zinc-800 bg-black/20 text-zinc-600 hover:border-zinc-600 hover:text-zinc-400'
                    }
                  `}
                  style={isSelected ? { boxShadow: `0 0 0 1px #0a1410, 0 0 12px ${cfg.glowColor}` } : undefined}
                >
                  {/* 段位标签 */}
                  <span className={`font-pixel text-[7px] tracking-widest ${isSelected ? cfg.color : 'text-zinc-700'}`}>
                    {cfg.tag}
                  </span>
                  {/* 秒数（大字） */}
                  <span className={`text-2xl font-black leading-none ${isSelected ? cfg.color : 'text-zinc-600'}`}>
                    {cfg.seconds}s
                  </span>
                  {/* 说明 */}
                  <span className={`text-[10px] text-center leading-snug ${isSelected ? 'text-zinc-400' : 'text-zinc-700'}`}>
                    {cfg.desc}
                  </span>
                  {/* 选中指示 */}
                  {isSelected && (
                    <span className={`font-pixel text-[6px] ${cfg.color} animate-blink`}>▲ 已选</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 当前选择提示 */}
          <div className={`border ${DIFFICULTY_CONFIG[selected].borderColor}/40 bg-black/20 px-3 py-2 text-xs text-center tracking-wide`}>
            <span className="text-zinc-500">限时 </span>
            <span className={`font-bold text-base ${DIFFICULTY_CONFIG[selected].color}`}>
              {DIFFICULTY_CONFIG[selected].seconds} 秒
            </span>
            <span className="text-zinc-500"> / 每轮，超时触发</span>
            <span className="text-red-400 font-bold"> 轮盘赌</span>
          </div>
        </div>

        {/* ── 玩家名称输入 ── */}
        <div className="w-full max-w-sm flex flex-col gap-1.5">
          <label className="font-pixel text-[8px] text-emerald-700 tracking-widest flex items-center gap-2">
            <Wifi size={10} className="text-emerald-700" />
            PLAYER NAME（联网对战用）
          </label>
          <input
            type="text"
            maxLength={12}
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            placeholder="输入昵称（最多12字）"
            className="
              w-full px-3 py-2 bg-black/40 border border-emerald-900
              text-emerald-300 text-sm placeholder:text-zinc-700
              focus:outline-none focus:border-emerald-600
              font-cn tracking-wide
            "
          />
        </div>

        {/* ── 开始按钮 ── */}
        <div className="w-full max-w-sm flex flex-col gap-3">
          <button
            onClick={() => onStart(selected)}
            className={`
              w-full py-4 px-6 text-lg tracking-[0.2em] font-bold
              ${DIFFICULTY_CONFIG[selected].bgColor} ${DIFFICULTY_CONFIG[selected].color}
              border-2 ${DIFFICULTY_CONFIG[selected].borderColor}
              hover:brightness-125
              active:scale-95 transition-all duration-100
              before:content-['▶_'] before:mr-1
            `}
            style={{ boxShadow: `0 0 0 1px #0a1410, 0 0 0 3px #164028, 0 0 20px ${DIFFICULTY_CONFIG[selected].glowColor}` }}
          >
            挑 战 电 脑
          </button>

          {/* 联网对战按钮 */}
          <button
            onClick={handleOnlineMatch}
            className="
              w-full py-3 px-6 text-base tracking-[0.2em] font-bold
              bg-violet-900/30 text-violet-300
              border-2 border-violet-700
              hover:bg-violet-900/50 hover:brightness-125
              active:scale-95 transition-all duration-100
              before:content-['⚔_'] before:mr-1
            "
            style={{ boxShadow: '0 0 0 1px #0a1410, 0 0 14px rgba(139,92,246,0.25)' }}
          >
            联 网 对 战
            <span className="ml-3 font-pixel text-[7px] text-violet-500 border border-violet-800 px-1.5 py-0.5 align-middle">
              ONLINE
            </span>
          </button>
        </div>

        {/* 最高记录 */}
        <div className="w-full max-w-sm">
          <div className="border border-emerald-900/60 bg-black/30 px-4 py-2.5 text-center text-sm text-emerald-700 tracking-widest">
            {bestRecord ? (
              <>
                最高记录：存活 <span className="text-yellow-500 font-bold">{bestRecord.rounds}</span> 轮
                &nbsp;·&nbsp; 正确率 <span className="text-yellow-500 font-bold">{bestRecord.accuracy}%</span>
              </>
            ) : (
              <span>尚无记录 — 快去挑战吧</span>
            )}
          </div>
        </div>

        {/* 规则简介 */}
        <div className="w-full max-w-lg border border-emerald-900/40 bg-black/20 p-3 text-xs text-emerald-700 space-y-1 leading-relaxed">
          <div className="font-pixel text-[8px] text-emerald-600 mb-1.5">— 游戏规则 —</div>
          <div>📖 接龙规则：首字与上词末字<span className="text-emerald-400">同字</span>或<span className="text-emerald-400">同音</span>均可</div>
          <div>⏱ 限时内未答对 → 触发<span className="text-red-400">轮盘赌</span>（难度决定时长）</div>
          <div>🔫 6 发弹仓含 2 发真子弹（约 33% 中弹概率）</div>
          <div>💀 中弹即游戏结束 / AI 中弹即胜利</div>
        </div>
      </div>

      {/* ── 底部状态栏 ── */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-emerald-900/50 bg-black/40 text-[9px] font-pixel text-emerald-800 shrink-0">
        <span>♥ ♥ ♥ ♥ ♥ ♥ ♥ ♡</span>
        <span>█ SELECT · START · QUIT</span>
      </div>
    </div>
  );
};

export default HomeScreen;
