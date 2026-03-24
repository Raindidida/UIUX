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
type RoulettePhase = 'fire' | 'result';

// ── 轮盘结果浮层（纯展示）────────────────────────────────────
const RouletteOverlay: React.FC<{
  phase: RoulettePhase;
  hit: boolean;
  isPlayer: boolean;
  opponentName: string;
  flashWhite: boolean;
  flashRed: boolean;
}> = ({ phase, hit, isPlayer, opponentName, flashWhite, flashRed }) => (
  <>
    {flashWhite && <div className="fixed inset-0 z-[500] bg-white/85 pointer-events-none" />}
    {flashRed   && <div className="fixed inset-0 z-[499] bg-red-800/55 pointer-events-none" />}
    {phase === 'result' && (
      <div className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none">
        <div className="text-center space-y-4 animate-slide-up">
          {hit ? (
            <>
              <div className={`font-black tracking-wider leading-tight text-[42px] drop-shadow-[0_0_30px_currentColor] ${isPlayer ? 'text-red-400' : 'text-yellow-300'}`}>
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
      </div>
    )}
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

  // ── 视频事件 ──────────────────────────────────────────────
  const [videoEvent, setVideoEvent] = useState<VideoEvent>('idle');

  // ── 轮盘状态（内嵌管理）───────────────────────────────────
  const [roulettePhase, setRoulettePhase] = useState<RoulettePhase | null>(null);
  const [flashWhite, setFlashWhite] = useState(false);
  const [flashRed, setFlashRed] = useState(false);
  const rouletteDoneRef = useRef(false);
  const roulettePhaseRef = useRef<RoulettePhase | null>(null);
  const rouletteVideoRef = useRef<VideoEvent | null>(null);
  const pendingTimeoutPenaltyRef = useRef(false);
  const timeoutVideoEndedWaitingRef = useRef(false);
  const penaltyFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRouletteRef = useRef<PendingRoulette | undefined>(undefined);
  const onPenaltyRef = useRef(onPenalty);
  useEffect(() => { onPenaltyRef.current = onPenalty; }, [onPenalty]);

  // ── 闪光定时器（统一管理）────────────────────────────────
  const flashTimers = useRef<{ t1?: ReturnType<typeof setTimeout>; t2?: ReturnType<typeof setTimeout>; t3?: ReturnType<typeof setTimeout> }>({});
  const clearFlash = useCallback(() => {
    clearTimeout(flashTimers.current.t1);
    clearTimeout(flashTimers.current.t2);
    clearTimeout(flashTimers.current.t3);
    flashTimers.current = {};
    setFlashWhite(false);
    setFlashRed(false);
  }, []);
  const startFlash = useCallback((hit: boolean) => {
    clearFlash();
    setFlashWhite(true);
    flashTimers.current.t1 = setTimeout(() => setFlashWhite(false), hit ? 400 : 150);
    if (hit) {
      flashTimers.current.t2 = setTimeout(() => setFlashRed(true), 80);
      flashTimers.current.t3 = setTimeout(() => setFlashRed(false), 520);
    }
  }, [clearFlash]);

  // ── 错误输入：红闪 + 提示文字，不锁定输入 ──────────────────
  const [wrongFlash, setWrongFlash] = useState(false);
  const [wrongMsg, setWrongMsg] = useState<string | null>(null);
  const wrongMsgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── 正确接龙动画（文字浮现在视频上）──────────────────────
  const [correctAnimText, setCorrectAnimText] = useState<string | null>(null);
  const correctAnimTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutCalledRef = useRef(false);

  // ── 每轮重置 ────────────────────────────────────────────
  useEffect(() => {
    setInputValue('');
    setTimeLeft(timerMax);
    // 轮盘正在进行时不覆盖轮盘视频（game:state-update 与 game:roulette 几乎同时到达时的竞态保护）
    if (!pendingRouletteRef.current) setVideoEvent('idle');
    setValidatePhase('idle');
    setValidateMsg('');
    setPhase('input');
    setIsSubmitting(false);
    setWrongMsg(null);
    setCorrectAnimText(null);
    if (wrongMsgTimerRef.current) clearTimeout(wrongMsgTimerRef.current);
    if (correctAnimTimerRef.current) clearTimeout(correctAnimTimerRef.current);
    timeoutCalledRef.current = false;
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
    setWrongMsg(null);
    if (wrongMsgTimerRef.current) clearTimeout(wrongMsgTimerRef.current);
    pendingTimeoutPenaltyRef.current = true;
    onPenaltyRef.current('timeout');
    if (penaltyFallbackRef.current) clearTimeout(penaltyFallbackRef.current);
    penaltyFallbackRef.current = setTimeout(() => {
      if (pendingTimeoutPenaltyRef.current) {
        pendingTimeoutPenaltyRef.current = false;
        if (rouletteVideoRef.current) {
          setVideoEvent(rouletteVideoRef.current);
          startFlash(pendingRouletteRef.current?.hit ?? false);
        }
      }
    }, 5000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startFlash]);

  // ── 输入错误：红闪 + 提示，不锁定输入 ────────────────────
  const showErrorAndResume = useCallback((err: FunnyError) => {
    setVideoEvent('idle');
    setValidatePhase('idle');
    setValidateMsg('');
    setIsSubmitting(false);
    setInputValue('');
    setWrongFlash(true);
    setWrongMsg(err.title);
    if (wrongMsgTimerRef.current) clearTimeout(wrongMsgTimerRef.current);
    wrongMsgTimerRef.current = setTimeout(() => setWrongMsg(null), 4000);
    setTimeout(() => inputRef.current?.focus(), 50);
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
      if (timeoutCalledRef.current) { setIsSubmitting(false); setValidatePhase('idle'); setValidateMsg(''); return; }
      setValidatePhase('done'); setValidateMsg('');
      if (!result.isIdiom) { setIsSubmitting(false); showErrorAndResume(getRandomError('not-idiom')); return; }
      const inputFirst = { char: result.firstChar, pinyin: result.firstPinyin };
      const prevLast = { char: currentIdiom.text.slice(-1), pinyin: currentIdiom.last };
      if (!isValidChainAI(inputFirst, prevLast)) { setIsSubmitting(false); showErrorAndResume(getRandomError('wrong-chain')); return; }
      setPhase('success'); stopTimer();
      setVideoEvent('correct');
      setWrongMsg(null);
      if (wrongMsgTimerRef.current) clearTimeout(wrongMsgTimerRef.current);
      // 正确动画
      setCorrectAnimText(trimmed);
      if (correctAnimTimerRef.current) clearTimeout(correctAnimTimerRef.current);
      correctAnimTimerRef.current = setTimeout(() => setCorrectAnimText(null), 1600);
      const successIdiom: Idiom = { text: trimmed, first: result.firstPinyin, last: result.lastPinyin };
      setTimeout(() => onCorrect(successIdiom), 1600);
    } catch {
      if (timeoutCalledRef.current) { setIsSubmitting(false); setValidatePhase('idle'); setValidateMsg(''); return; }
      setValidatePhase('done'); setValidateMsg('');
      const { findIdiom, isValidChain } = await import('../data/idioms');
      const found = findIdiom(trimmed);
      if (!found) { setIsSubmitting(false); showErrorAndResume(getRandomError('not-idiom')); return; }
      if (!isValidChain(found, currentIdiom)) { setIsSubmitting(false); showErrorAndResume(getRandomError('wrong-chain')); return; }
      setPhase('success'); stopTimer();
      setVideoEvent('correct');
      setWrongMsg(null);
      if (wrongMsgTimerRef.current) clearTimeout(wrongMsgTimerRef.current);
      setCorrectAnimText(trimmed);
      if (correctAnimTimerRef.current) clearTimeout(correctAnimTimerRef.current);
      correctAnimTimerRef.current = setTimeout(() => setCorrectAnimText(null), 1600);
      setTimeout(() => onCorrect(found), 1600);
    }
  }, [phase, isSubmitting, inputValue, currentIdiom, onCorrect, showErrorAndResume]);

  // ═══ 轮盘状态机 ════════════════════════════════════════════
  useEffect(() => {
    if (!pendingRoulette) {
      setRoulettePhase(null);
      roulettePhaseRef.current = null;
      rouletteVideoRef.current = null;
      pendingRouletteRef.current = undefined;
      timeoutVideoEndedWaitingRef.current = false;
      clearFlash();
      rouletteDoneRef.current = false;
      return;
    }
    pendingRouletteRef.current = pendingRoulette;
    stopTimer();
    rouletteDoneRef.current = false;
    // 轮盘开始，清除错误提示
    setWrongMsg(null);
    if (wrongMsgTimerRef.current) clearTimeout(wrongMsgTimerRef.current);

    const { target, hit } = pendingRoulette;
    const fireVideo: VideoEvent = target === 'player'
      ? (hit ? 'roulette-bang-player' : 'roulette-miss-player')
      : (hit ? 'roulette-bang-opponent' : 'roulette-miss-opponent');

    rouletteVideoRef.current = fireVideo;
    setRoulettePhase('fire');
    roulettePhaseRef.current = 'fire';

    if (pendingTimeoutPenaltyRef.current) {
      // timeout 视频正在播，只准备引用；handleVideoEnded 播完后无缝切换
      return () => clearFlash();
    }

    if (timeoutVideoEndedWaitingRef.current) {
      // timeout 视频已播完，服务端结果刚到；立即切换
      timeoutVideoEndedWaitingRef.current = false;
      setVideoEvent(fireVideo);
      startFlash(hit);
      return () => clearFlash();
    }

    setVideoEvent(fireVideo);
    startFlash(hit);
    return () => clearFlash();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingRoulette]);

  // ── 视频播完回调 ─────────────────────────────────────────
  const handleVideoEnded = useCallback(() => {
    // timeout 视频播完 → 无缝切换到轮盘视频
    if (pendingTimeoutPenaltyRef.current) {
      pendingTimeoutPenaltyRef.current = false;
      if (penaltyFallbackRef.current) { clearTimeout(penaltyFallbackRef.current); penaltyFallbackRef.current = null; }
      if (rouletteVideoRef.current) {
        setVideoEvent(rouletteVideoRef.current);
        startFlash(pendingRouletteRef.current?.hit ?? false);
      } else {
        timeoutVideoEndedWaitingRef.current = true;
      }
      return;
    }
    // 轮盘结果视频播完 → 显示结果文字
    if (roulettePhaseRef.current !== 'fire') return;
    if (!rouletteVideoRef.current) return;
    setRoulettePhase('result');
    roulettePhaseRef.current = 'result';
  }, [startFlash]);

  // 结果文字展示 1s 后触发完成回调
  useEffect(() => {
    if (roulettePhase !== 'result' || !pendingRoulette || rouletteDoneRef.current) return;
    rouletteDoneRef.current = true;
    const { target, hit } = pendingRoulette;
    const t = setTimeout(() => onRouletteComplete?.(target, !hit), 1000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roulettePhase, pendingRoulette]);

  // ── 派生状态 ─────────────────────────────────────────────
  const timerPct = (timeLeft / timerMax) * 100;
  const timerDanger = timeLeft <= Math.ceil(timerMax * 0.3);
  const isValidating = validatePhase === 'validating';
  const isMyTurn = !isOnlineMode || isYourTurn;
  const hasRoulette = !!roulettePhase && !!pendingRoulette;
  const inputDisabled = phase === 'success' || isValidating || frozen || hasRoulette;

  // ════════════════════════════════════════════════════════════
  return (
    <div className="relative min-h-screen overflow-hidden bg-black font-cn">

      {/* ══ 全屏视频背景（z-0）══ */}
      <div className="absolute inset-0 z-0">
        <VideoScene event={videoEvent} fill className="w-full h-full" onEnded={handleVideoEnded} />
      </div>

      {/* ══ 错误红闪（输入失败，animation 结束后自动隐藏）══ */}
      {wrongFlash && (
        <div
          className="fixed inset-0 z-[480] pointer-events-none animate-red-flash"
          onAnimationEnd={() => setWrongFlash(false)}
        />
      )}

      {/* ══ 轮盘闪光 / 结果浮层 ══ */}
      {hasRoulette && (
        <RouletteOverlay
          phase={roulettePhase!}
          hit={pendingRoulette!.hit}
          isPlayer={pendingRoulette!.target === 'player'}
          opponentName={opponentName}
          flashWhite={flashWhite}
          flashRed={flashRed}
        />
      )}

      {/* ══ UI 层（z-20）══ */}
      <div className="relative z-20 flex flex-col min-h-screen">

        {/* ── 顶部状态栏 ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-3 py-2 bg-black/70 backdrop-blur-sm border-b border-white/10 shrink-0 gap-3">
          {/* 左：玩家子弹 */}
          <div className="flex flex-col gap-0.5 min-w-[80px]">
            <span className="font-pixel text-[6px] text-emerald-700">1P 你</span>
            {playerSlots
              ? <BulletSlotsBar slots={playerSlots} isPlayer />
              : <span className="font-pixel text-[6px] text-emerald-800">♥ ♥ ♥</span>}
          </div>

          {/* 中：倒计时 */}
          <div className="flex flex-col items-center gap-1 flex-1 max-w-[160px]">
            <div className="flex items-center gap-2 w-full">
              <div className="flex-1 h-2 border border-emerald-800/60 bg-black/40 overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ${timerDanger ? 'bg-red-600' : 'bg-emerald-500'}`}
                  style={{
                    width: `${timerPct}%`,
                    boxShadow: timerDanger
                      ? '0 0 6px rgba(220,38,38,0.8)'
                      : '0 0 4px rgba(52,211,153,0.5)',
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
            {aiSlots
              ? <BulletSlotsBar slots={aiSlots} isPlayer={false} />
              : <span className="font-pixel text-[6px] text-red-900">♥ ♥ ♥</span>}
          </div>
        </div>

        {/* ── 对手输入面板（顶部，仅在对手回合 + 非轮盘）─────────── */}
        {!isMyTurn && !hasRoulette && (
          <div className="shrink-0 border-b px-4 py-2.5 bg-violet-950/55 backdrop-blur-sm border-violet-800/40">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
              <span className="font-pixel text-[7px] text-violet-400 tracking-widest">
                ⏳ {opponentName} 接龙中…
              </span>
              <span className="ml-auto font-pixel text-[6px] text-violet-900">ONLINE</span>
            </div>
            <div className="flex gap-2 items-center">
              <div className="flex-1 bg-violet-950/50 border border-violet-800/40 px-3 py-2.5 flex items-center gap-3 min-h-[44px] cursor-not-allowed select-none">
                <ScrambledText length={3} />
              </div>
              <div className="px-4 py-2.5 bg-violet-950/20 border border-violet-900/30 text-violet-800 text-sm font-pixel cursor-not-allowed select-none">
                等待中
              </div>
            </div>
          </div>
        )}

        {/* ── 中间透明区域（视频透出 + 浮层）─────────────────────── */}
        <div className="flex-1 relative min-h-0">

          {/* 对手名字标签 */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
            <div className="bg-black/60 border border-emerald-800/50 px-3 py-1 text-[11px] text-emerald-400 font-pixel tracking-wider backdrop-blur-sm">
              {opponentName}
            </div>
          </div>

          {/* 对手回合：中下方显示末字提示 */}
          {!isMyTurn && !hasRoulette && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
              <div className="bg-black/70 border border-yellow-900/50 px-3 py-1.5 backdrop-blur-sm flex items-center gap-2">
                <span className="font-pixel text-[6px] text-yellow-800">接龙末字：</span>
                <span className="text-yellow-300 font-black text-xl">{currentIdiom.text.slice(-1)}</span>
                <span className="font-pixel text-[6px] text-yellow-900">({currentIdiom.last})</span>
              </div>
            </div>
          )}

          {/* 正确接龙动画浮层 */}
          {correctAnimText && (
            <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
              <div className="text-center animate-correct-pop">
                <div
                  className="text-5xl font-black text-emerald-300 tracking-widest"
                  style={{ textShadow: '0 0 40px rgba(52,211,153,0.9), 0 0 80px rgba(52,211,153,0.4)' }}
                >
                  {correctAnimText}
                </div>
                <div className="font-pixel text-[10px] text-emerald-400 tracking-[0.5em] mt-2">
                  ✓ · CHAIN · OK · ✓
                </div>
              </div>
            </div>
          )}

          {/* 验证加载指示器 */}
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
        </div>

        {/* ── 玩家输入面板（底部，仅在玩家回合 + 非轮盘）──────────── */}
        {isMyTurn && !hasRoulette && (
          <div className="shrink-0 border-t px-4 py-3 space-y-2 bg-black/80 backdrop-blur-sm border-emerald-800/40">

            {/* 错误提示条（接龙失败）*/}
            {wrongMsg && (
              <div className="flex items-center gap-2 px-2 py-1.5 bg-red-950/70 border border-red-800/50 animate-shake-x">
                <span className="text-red-400 text-sm shrink-0">⚠</span>
                <span className="text-red-300 text-sm font-bold flex-1 truncate">{wrongMsg}</span>
                <span className="font-pixel text-[6px] text-red-600 animate-blink shrink-0">重试</span>
              </div>
            )}

            {/* 当前成语显示 */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-pixel text-[7px] text-emerald-700 shrink-0">当前：</span>
              <div className="flex gap-1">
                {currentIdiom.text.split('').map((ch, i) => (
                  <span
                    key={i}
                    className={`inline-flex items-center justify-center w-8 h-8 border text-base font-bold ${
                      i === currentIdiom.text.length - 1
                        ? 'border-yellow-600/80 bg-yellow-900/40 text-yellow-200'
                        : 'border-emerald-800/60 bg-emerald-950/60 text-emerald-200'
                    }`}
                  >{ch}</span>
                ))}
              </div>
              <span className="text-xs text-emerald-700">→ 末：</span>
              <span className="text-yellow-300 font-bold text-lg">{currentIdiom.text.slice(-1)}</span>
              <span className="font-pixel text-[6px] text-emerald-800">({currentIdiom.last})</span>
            </div>

            {/* 输入框 + 提交 */}
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={e => { if (!inputDisabled) setInputValue(e.target.value); }}
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

            <div className="font-pixel text-[6px] text-emerald-900/60">
              按 Enter 提交 │ AI 实时验证成语 │ 超时或接错 → 轮盘赌
            </div>
          </div>
        )}

        {/* 轮盘进行中底部提示 */}
        {hasRoulette && (
          <div className="shrink-0 py-2 text-center font-pixel text-[7px] text-zinc-600 tracking-widest">
            ⚠ · ROULETTE · IN · PROGRESS · ⚠
          </div>
        )}

        {/* ── 底部状态栏 ─────────────────────────────────────────── */}
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
