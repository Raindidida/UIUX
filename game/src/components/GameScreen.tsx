import React, { useState, useEffect, useRef, useCallback } from 'react';
import VideoScene, { VideoEvent } from './VideoScene';
import { Idiom } from '../data/idioms';
import { getRandomError, FunnyError } from '../data/funnyErrors';
import { validateIdiomWithAI, isValidChainAI } from '../data/zhipuApi';
import { BulletSlot } from '../App';

// ── 轮盘数据（从 App 传入）──────────────────────────────────────
export interface PendingRoulette {
  target: 'player' | 'ai';
  hit: boolean;
  chamber: number;
}

interface Props {
  currentIdiom: Idiom;
  round: number;
  opponentName: string;
  timerMax: number;
  frozen?: boolean;
  playerSlots?: BulletSlot[];
  aiSlots?: BulletSlot[];
  onCorrect: (input: Idiom) => void;
  onPenalty: (type: 'not-idiom' | 'wrong-chain' | 'timeout') => void;
  onQuit?: () => void;
  onRouletteComplete?: (target: 'player' | 'ai', survived: boolean) => void;
  isOnlineMode?: boolean;
  isYourTurn?: boolean;
  pendingRoulette?: PendingRoulette;
}

// ── 子弹槽 ────────────────────────────────────────────────────
const BulletSlotsBar: React.FC<{ slots: BulletSlot[]; isPlayer: boolean }> = ({ slots, isPlayer }) => (
  <div className="flex gap-1">
    {slots.map((s, i) => (
      <div
        key={i}
        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all duration-300 ${
          s.fired
            ? s.hasBullet
              ? 'bg-red-900/70 border-red-600 shadow-[0_0_4px_rgba(220,38,38,0.7)]'
              : 'bg-zinc-900 border-zinc-700 opacity-30'
            : isPlayer
              ? 'bg-emerald-900/40 border-emerald-600 shadow-[0_0_3px_rgba(52,211,153,0.3)]'
              : 'bg-red-900/20 border-red-800'
        }`}
      >
        <span className="text-[5px]">
          {s.fired ? (s.hasBullet ? '✕' : '·') : '○'}
        </span>
      </div>
    ))}
  </div>
);

// ── 乱码文字（对手输入占位）────────────────────────────────────
const ScrambledText: React.FC<{ length: number }> = ({ length }) => {
  const [chars, setChars] = useState<string[]>([]);
  const POOL = '田由甲申甴电甶男甸甹町画甼甽甾甿畀畁畂畃畄畅畆畇畈畉畊畋界畍畎畏畐畑';
  useEffect(() => {
    const gen = () => Array.from({ length: Math.max(length, 2) }, () => POOL[Math.floor(Math.random() * POOL.length)]);
    setChars(gen());
    const id = setInterval(() => setChars(gen()), 120);
    return () => clearInterval(id);
  }, [length]);
  return <span className="tracking-widest text-violet-400 font-bold text-lg select-none blur-[1px]">{chars.join('')}</span>;
};

// ── 轮盘阶段类型 ──────────────────────────────────────────────
type RoulettePhase = 'spin' | 'countdown' | 'fire' | 'result';

// ── 轮盘结果浮层（纯展示，状态由 GameScreen 管理）────────────────
const RouletteOverlay: React.FC<{
  phase: RoulettePhase;
  countdown: number;
  hit: boolean;
  isPlayer: boolean;
  opponentName: string;
  flashWhite: boolean;
  flashRed: boolean;
}> = ({ phase, countdown, hit, isPlayer, opponentName, flashWhite, flashRed }) => (
  <>
    {/* 开枪白闪 */}
    {flashWhite && <div className="fixed inset-0 z-[500] bg-white/85 pointer-events-none" />}
    {/* 中弹红屏 */}
    {flashRed && <div className="fixed inset-0 z-[499] bg-red-800/55 pointer-events-none" />}

    {/* 主浮层内容 */}
    <div className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none">
      <div className="text-center">

        {/* 弹仓旋转 */}
        {phase === 'spin' && (
          <div className="font-pixel text-[14px] text-zinc-300 tracking-[0.5em] animate-pulse drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
            ⟳ &nbsp;弹仓旋转中…
          </div>
        )}

        {/* 倒计时 */}
        {phase === 'countdown' && (
          <div className="space-y-3">
            <div className="font-pixel text-[9px] text-zinc-400 tracking-[0.4em] drop-shadow-[0_2px_4px_black]">
              {isPlayer ? '— 接受轮盘惩罚 —' : `— ${opponentName} 接受轮盘惩罚 —`}
            </div>
            <div
              className={`font-pixel font-black leading-none tabular-nums
                drop-shadow-[0_0_40px_currentColor]
                ${countdown <= 1
                  ? 'text-red-500 animate-blink text-[100px]'
                  : countdown <= 2
                    ? 'text-orange-400 text-[96px]'
                    : 'text-yellow-300 text-[92px]'
                }`}
            >
              {countdown}
            </div>
            <div className="font-pixel text-[7px] text-zinc-600 tracking-[0.6em]">
              AUTO · FIRE
            </div>
          </div>
        )}

        {/* 开枪瞬间 */}
        {phase === 'fire' && (
          <div className={`text-[72px] leading-none drop-shadow-[0_0_24px_currentColor] ${hit ? 'text-red-500' : 'text-zinc-200'}`}>
            {hit ? '💥' : '💨'}
          </div>
        )}

        {/* 结果 */}
        {phase === 'result' && (
          <div className="space-y-4 animate-slide-up">
            {hit ? (
              <>
                <div className={`
                  font-black tracking-wider leading-tight text-[40px]
                  drop-shadow-[0_0_30px_currentColor]
                  ${isPlayer ? 'text-red-400' : 'text-yellow-300'}
                `}>
                  {isPlayer ? '💀 你中弹了！' : `🎯 ${opponentName} 中弹！`}
                </div>
                <div className="font-pixel text-[10px] text-zinc-400 tracking-[0.5em]">
                  {isPlayer ? 'GAME · OVER' : 'ENEMY · ELIMINATED'}
                </div>
              </>
            ) : (
              <>
                <div className="font-black tracking-wider leading-tight text-[38px] text-emerald-300 drop-shadow-[0_0_30px_currentColor]">
                  {isPlayer ? '🕳 空枪！捡了一命' : `😤 ${opponentName} 侥幸存活`}
                </div>
                <div className="font-pixel text-[10px] text-zinc-500 tracking-[0.5em]">
                  {isPlayer ? 'SURVIVED · CONTINUE' : 'ENEMY · LIVES · ON'}
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  </>
);

// ── 验证状态 ──────────────────────────────────────────────────
type ValidatePhase = 'idle' | 'validating' | 'done';

// ═══════════════════════════════════════════════════════════════
const GameScreen: React.FC<Props> = ({
  currentIdiom,
  round,
  opponentName,
  timerMax,
  frozen = false,
  playerSlots,
  aiSlots,
  onCorrect,
  onPenalty,
  onQuit,
  onRouletteComplete,
  isOnlineMode = false,
  isYourTurn = true,
  pendingRoulette,
}) => {
  // ── 输入状态 ──────────────────────────────────────────────
  const [inputValue, setInputValue] = useState('');
  const [timeLeft, setTimeLeft] = useState(timerMax);
  const [phase, setPhase] = useState<'input' | 'success'>('input');
  const [validatePhase, setValidatePhase] = useState<ValidatePhase>('idle');
  const [validateMsg, setValidateMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorInfo, setErrorInfo] = useState<FunnyError | null>(null);
  const [errorKey, setErrorKey] = useState(0);

  // ── 视频事件 ──────────────────────────────────────────────
  const [videoEvent, setVideoEvent] = useState<VideoEvent>('idle');

  // ── 轮盘状态（内嵌管理）───────────────────────────────────
  const [roulettePhase, setRoulettePhase] = useState<RoulettePhase | null>(null);
  const [rouletteCountdown, setRouletteCountdown] = useState(3);
  const [flashWhite, setFlashWhite] = useState(false);
  const [flashRed, setFlashRed] = useState(false);
  const rouletteDoneRef = useRef(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutCalledRef = useRef(false);
  const errorClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── 每轮重置 ────────────────────────────────────────────
  useEffect(() => {
    setInputValue('');
    setTimeLeft(timerMax);
    setVideoEvent('idle');
    setErrorInfo(null);
    setValidatePhase('idle');
    setValidateMsg('');
    setPhase('input');
    setIsSubmitting(false);
    timeoutCalledRef.current = false;
    if (errorClearRef.current) clearTimeout(errorClearRef.current);
    if (!isOnlineMode || isYourTurn) setTimeout(() => inputRef.current?.focus(), 100);
  }, [currentIdiom, isYourTurn, isOnlineMode]);

  // ── 对手回合时视频切为 thinking ───────────────────────────
  useEffect(() => {
    if (!pendingRoulette) {
      setVideoEvent(isOnlineMode && !isYourTurn ? 'thinking' : 'idle');
    }
  }, [isOnlineMode, isYourTurn, pendingRoulette]);

  // ── 倒计时 ──────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'input') return;
    if (frozen) return;
    if (pendingRoulette) return;
    if (isOnlineMode && !isYourTurn) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current!); handleTimeout(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentIdiom, timerMax, frozen, isYourTurn, pendingRoulette]);

  const stopTimer = () => { if (timerRef.current) clearInterval(timerRef.current); };

  const handleTimeout = useCallback(() => {
    if (timeoutCalledRef.current) return;
    timeoutCalledRef.current = true;
    stopTimer();
    setPhase('success');
    setVideoEvent('timeout');
    setErrorInfo(getRandomError('timeout'));
    setErrorKey(k => k + 1);
    setTimeout(() => onPenalty('timeout'), 2000);
  }, [onPenalty]);

  const showErrorAndResume = useCallback((err: FunnyError) => {
    setErrorInfo(err);
    setErrorKey(k => k + 1);
    setVideoEvent('wrong');
    setInputValue('');
    if (errorClearRef.current) clearTimeout(errorClearRef.current);
    errorClearRef.current = setTimeout(() => {
      setErrorInfo(null);
      setVideoEvent('idle');
      inputRef.current?.focus();
    }, 1200);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (phase !== 'input' || isSubmitting || timeoutCalledRef.current) return;
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setIsSubmitting(true);
    setValidatePhase('validating');
    setValidateMsg(`正在验证「${trimmed}」…`);
    setVideoEvent('thinking');
    try {
      const result = await validateIdiomWithAI(trimmed);
      setValidatePhase('done'); setValidateMsg('');
      if (!result.isIdiom) { setIsSubmitting(false); showErrorAndResume(getRandomError('not-idiom')); return; }
      const inputFirst = { char: result.firstChar, pinyin: result.firstPinyin };
      const prevLast = { char: currentIdiom.text.slice(-1), pinyin: currentIdiom.last };
      if (!isValidChainAI(inputFirst, prevLast)) { setIsSubmitting(false); showErrorAndResume(getRandomError('wrong-chain')); return; }
      setPhase('success'); stopTimer();
      setVideoEvent('correct'); setErrorInfo(null);
      const successIdiom: Idiom = { text: trimmed, first: result.firstPinyin, last: result.lastPinyin };
      setTimeout(() => onCorrect(successIdiom), 1600);
    } catch {
      setValidatePhase('done'); setValidateMsg('');
      const { findIdiom, isValidChain } = await import('../data/idioms');
      const found = findIdiom(trimmed);
      if (!found) { setIsSubmitting(false); showErrorAndResume(getRandomError('not-idiom')); return; }
      if (!isValidChain(found, currentIdiom)) { setIsSubmitting(false); showErrorAndResume(getRandomError('wrong-chain')); return; }
      setPhase('success'); stopTimer();
      setVideoEvent('correct'); setErrorInfo(null);
      setTimeout(() => onCorrect(found), 1600);
    }
  }, [phase, isSubmitting, inputValue, currentIdiom, onCorrect, showErrorAndResume]);

  // ═══ 轮盘状态机（由 pendingRoulette prop 驱动）════════════
  useEffect(() => {
    if (!pendingRoulette) {
      setRoulettePhase(null);
      rouletteDoneRef.current = false;
      return;
    }
    stopTimer();
    setRoulettePhase('spin');
    setRouletteCountdown(3);
    rouletteDoneRef.current = false;
    setVideoEvent('roulette-spin');
    const t = setTimeout(() => setRoulettePhase('countdown'), 1000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingRoulette]);

  useEffect(() => {
    if (roulettePhase !== 'countdown') return;
    if (rouletteCountdown <= 0) { setRoulettePhase('fire'); return; }
    const t = setTimeout(() => setRouletteCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [roulettePhase, rouletteCountdown]);

  useEffect(() => {
    if (roulettePhase !== 'fire' || !pendingRoulette) return;
    const { target, hit } = pendingRoulette;
    // 切换结果视频
    if (target === 'player') setVideoEvent(hit ? 'roulette-bang-player' : 'roulette-miss-player');
    else setVideoEvent(hit ? 'roulette-bang-opponent' : 'roulette-miss-opponent');
    // 闪光效果
    setFlashWhite(true);
    setTimeout(() => setFlashWhite(false), hit ? 500 : 200);
    if (hit) {
      setTimeout(() => setFlashRed(true), 100);
      setTimeout(() => { setFlashRed(false); setRoulettePhase('result'); }, 900);
    } else {
      setTimeout(() => setRoulettePhase('result'), 700);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roulettePhase]);

  useEffect(() => {
    if (roulettePhase !== 'result' || !pendingRoulette || rouletteDoneRef.current) return;
    rouletteDoneRef.current = true;
    const { target, hit } = pendingRoulette;
    const t = setTimeout(() => onRouletteComplete?.(target, !hit), 2500);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roulettePhase, pendingRoulette]);

  // ── 派生状态 ────────────────────────────────────────────
  const timerPct = (timeLeft / timerMax) * 100;
  const timerDanger = timeLeft <= Math.ceil(timerMax * 0.3);
  const isValidating = validatePhase === 'validating';
  const isMyTurn = !isOnlineMode || isYourTurn;
  const hasRoulette = !!roulettePhase;
  const inputDisabled = phase === 'success' || isValidating || !isMyTurn || frozen || hasRoulette;

  return (
    <div className="relative min-h-screen overflow-hidden bg-black font-cn">

      {/* ══ 全屏视频背景（z-0）══ */}
      <div className="absolute inset-0 z-0">
        <VideoScene event={videoEvent} fill className="w-full h-full" />
      </div>

      {/* ══ 开枪/中弹闪光（由 RouletteOverlay 渲染，z-500/499）══ */}
      {hasRoulette && (
        <RouletteOverlay
          phase={roulettePhase!}
          countdown={rouletteCountdown}
          hit={pendingRoulette!.hit}
          isPlayer={pendingRoulette!.target === 'player'}
          opponentName={opponentName}
          flashWhite={flashWhite}
          flashRed={flashRed}
        />
      )}

      {/* ══ UI 层（z-20）══ */}
      <div className="relative z-20 flex flex-col min-h-screen">

        {/* ── 顶部状态栏 ─────────────────────────────────── */}
        <div className="flex items-center justify-between px-3 py-2 bg-black/70 backdrop-blur-sm border-b border-white/10 shrink-0 gap-3">
          {/* 左：玩家子弹 */}
          <div className="flex flex-col gap-0.5 min-w-[80px]">
            <span className="font-pixel text-[6px] text-emerald-700">1P 你</span>
            {playerSlots ? <BulletSlotsBar slots={playerSlots} isPlayer /> : <span className="font-pixel text-[6px] text-emerald-800">♥ ♥ ♥</span>}
          </div>

          {/* 中：倒计时 */}
          <div className="flex flex-col items-center gap-1 flex-1 max-w-[160px]">
            <div className="flex items-center gap-2 w-full">
              <div className="flex-1 h-2 border border-emerald-800/60 bg-black/40 overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ${timerDanger ? 'bg-red-600' : 'bg-emerald-500'}`}
                  style={{
                    width: `${timerPct}%`,
                    boxShadow: timerDanger ? '0 0 6px rgba(220,38,38,0.8)' : '0 0 4px rgba(52,211,153,0.5)',
                  }}
                />
              </div>
              <span className={`font-pixel text-[11px] min-w-[20px] text-right tabular-nums ${timerDanger ? 'text-red-400 animate-blink' : 'text-emerald-300'}`}>
                {(frozen || (isOnlineMode && !isYourTurn) || hasRoulette) ? '—' : timeLeft}
              </span>
            </div>
            <div className="font-pixel text-[6px] text-emerald-900">
              回合 {String(round).padStart(2, '0')} · VS {opponentName}
            </div>
          </div>

          {/* 右：对手子弹 + 退出 */}
          <div className="flex flex-col gap-0.5 items-end min-w-[80px]">
            <div className="flex items-center gap-1.5">
              <span className="font-pixel text-[6px] text-red-900">2P {opponentName}</span>
              {onQuit && (
                <button
                  onClick={onQuit}
                  className="px-1.5 py-0.5 font-pixel text-[6px] tracking-wider border border-red-900/60 bg-red-950/40 text-red-700 hover:bg-red-900/60 hover:text-red-300 active:scale-95 transition-all"
                  title="退出游戏"
                >✕</button>
              )}
            </div>
            {aiSlots ? <BulletSlotsBar slots={aiSlots} isPlayer={false} /> : <span className="font-pixel text-[6px] text-red-900">♥ ♥ ♥</span>}
          </div>
        </div>

        {/* ── 接龙输入面板 ────────────────────────────────── */}
        <div className={`shrink-0 border-b px-4 py-3 space-y-2.5 bg-black/70 backdrop-blur-sm transition-colors ${
          isMyTurn ? 'border-emerald-800/40' : 'border-violet-800/40'
        }`}>

          {/* 联网回合指示 */}
          {isOnlineMode && !hasRoulette && (
            <div className={`flex items-center gap-2 py-1 px-2 text-[8px] font-pixel tracking-widest border ${
              isYourTurn
                ? 'bg-emerald-950/40 border-emerald-800/30 text-emerald-500'
                : 'bg-violet-950/40 border-violet-800/30 text-violet-500 animate-pulse'
            }`}>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-current" />
              {isYourTurn ? '⚔ 你的回合 — 输入成语接龙' : `⏳ 等待 ${opponentName} 接龙…`}
              <span className="ml-auto opacity-30">ONLINE</span>
            </div>
          )}

          {/* 当前成语 */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-pixel text-[7px] text-emerald-700 shrink-0">当前：</span>
            <div className="flex gap-1">
              {currentIdiom.text.split('').map((ch, i) => (
                <span key={i} className={`inline-flex items-center justify-center w-8 h-8 border text-base font-bold ${
                  i === currentIdiom.text.length - 1
                    ? 'border-yellow-600/80 bg-yellow-900/40 text-yellow-200'
                    : 'border-emerald-800/60 bg-emerald-950/60 text-emerald-200'
                }`}>{ch}</span>
              ))}
            </div>
            <span className="text-xs text-emerald-700">→ 末：</span>
            <span className="text-yellow-300 font-bold text-lg">{currentIdiom.text.slice(-1)}</span>
            <span className="font-pixel text-[6px] text-emerald-800">({currentIdiom.last})</span>
          </div>

          {/* 输入框 / 等待占位 */}
          {!hasRoulette && (isMyTurn ? (
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={e => { if (phase === 'input') setInputValue(e.target.value); }}
                onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
                maxLength={8}
                placeholder={`首字同「${currentIdiom.text.slice(-1)}」字或同「${currentIdiom.last}」音…`}
                disabled={inputDisabled}
                className="flex-1 bg-black/50 border-2 border-emerald-700/70 text-emerald-200 px-3 py-2 text-lg tracking-widest font-cn placeholder:text-emerald-900/80 outline-none focus:border-emerald-400 focus:shadow-[0_0_12px_rgba(52,211,153,0.25)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              />
              <button
                onClick={handleSubmit}
                disabled={inputDisabled || !inputValue.trim()}
                className="px-5 py-2 bg-emerald-900/50 border-2 border-emerald-600/70 text-emerald-200 hover:bg-emerald-800/60 hover:border-emerald-400 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm tracking-widest font-bold"
              >
                {isValidating ? '验证…' : '接龙 ↵'}
              </button>
            </div>
          ) : (
            <div className="flex gap-2 items-center">
              <div className="flex-1 bg-violet-950/40 border-2 border-violet-900/50 px-3 py-2 flex items-center gap-3 min-h-[44px]">
                <span className="font-pixel text-[6px] text-violet-700 shrink-0">对方输入中</span>
                <ScrambledText length={3} />
              </div>
              <div className="px-4 py-2 bg-violet-950/20 border-2 border-violet-900/30 text-violet-800 text-sm font-pixel cursor-not-allowed select-none">等待中</div>
            </div>
          ))}

          {/* 轮盘进行中时隐藏输入框，显示提示 */}
          {hasRoulette && (
            <div className="py-1 text-center font-pixel text-[8px] text-zinc-500 tracking-widest animate-pulse">
              ⚠ &nbsp;轮盘进行中，请稍候…
            </div>
          )}

          <div className="font-pixel text-[6px] text-emerald-900/70">
            {isMyTurn && !hasRoulette
              ? '按 Enter 提交 │ AI 实时验证成语 │ 超时或接错 → 轮盘赌'
              : !isMyTurn
                ? `等待 ${opponentName} 接龙中…`
                : ''}
          </div>
        </div>

        {/* ── 中间透明区域（视频透出）────────────────────── */}
        <div className="flex-1 relative">

          {/* 对手名字标签 */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
            <div className="bg-black/60 border border-emerald-800/50 px-3 py-1 text-[11px] text-emerald-400 font-pixel tracking-wider backdrop-blur-sm">
              {opponentName}
            </div>
          </div>

          {/* 验证加载 */}
          {isValidating && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-black/80 backdrop-blur-sm border border-emerald-700/60 px-6 py-4 flex flex-col items-center gap-3">
                <div className="flex gap-2">
                  {[0, 0.2, 0.4].map((d, i) => (
                    <div key={i} className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: `${d}s` }} />
                  ))}
                </div>
                <div className="font-pixel text-[8px] text-emerald-400 tracking-widest">
                  {validateMsg || '智谱验证中…'}
                </div>
              </div>
            </div>
          )}

          {/* 错误提示横幅 */}
          {errorInfo && (
            <div key={errorKey} className="absolute top-2 left-2 right-2 pointer-events-none animate-slide-up">
              <div className="bg-red-950/90 backdrop-blur-sm border border-red-700/70 px-4 py-2.5 flex items-start gap-3" style={{ boxShadow: '0 0 16px rgba(220,38,38,0.3)' }}>
                <div className="w-1 self-stretch bg-red-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-pixel text-[7px] text-red-500 tracking-widest mb-0.5">{errorInfo.article}</div>
                  <div className="text-red-200 text-sm font-bold leading-snug truncate">{errorInfo.title}</div>
                  <p className="text-zinc-500 text-xs mt-0.5 line-clamp-2">{errorInfo.body}</p>
                </div>
                <div className="font-pixel text-[6px] text-red-800 animate-blink shrink-0">⚠ 继续<br />输入</div>
              </div>
            </div>
          )}
        </div>

        {/* ── 底部状态栏 ──────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-1.5 bg-black/60 backdrop-blur-sm border-t border-white/10 text-[7px] font-pixel text-emerald-900 shrink-0">
          <span className={timerDanger && isMyTurn && !hasRoulette ? 'text-red-600 animate-blink' : ''}>
            {timerDanger && isMyTurn && !hasRoulette ? '⚠ 危险！' : '◈ DEATHMATCH'}
          </span>
          <span>智谱 GLM-4-Flash</span>
          {onQuit && (
            <button onClick={onQuit} className="text-red-900 hover:text-red-500 transition-colors cursor-pointer">
              █ 退出
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameScreen;
export type { PendingRoulette };
