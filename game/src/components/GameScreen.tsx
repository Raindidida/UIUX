import React, { useState, useEffect, useRef, useCallback } from 'react';
import VideoScene, { VideoEvent } from './VideoScene';
import { Idiom } from '../data/idioms';
import { getRandomError, FunnyError } from '../data/funnyErrors';
import { validateIdiomWithAI, isValidChainAI } from '../data/zhipuApi';
import { BulletSlot } from '../App';

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
  isOnlineMode?: boolean;
  isYourTurn?: boolean;
  opponentInput?: string; // 对手正在输入的内容（用于显示乱码）
}

// 子弹槽可视化组件
const BulletSlotsBar: React.FC<{
  slots: BulletSlot[];
  label: string;
  isPlayer: boolean;
}> = ({ slots, label, isPlayer }) => (
  <div className="flex items-center gap-1.5">
    <span className={`font-pixel text-[6px] shrink-0 ${isPlayer ? 'text-emerald-700' : 'text-red-800'}`}>
      {label}
    </span>
    <div className="flex gap-1">
      {slots.map((s, i) => (
        <div
          key={i}
          title={s.fired ? (s.hasBullet ? '💀 真弹（已击发）' : '空弹（已击发）') : '未开'}
          className={`
            w-4 h-4 rounded-full border flex items-center justify-center
            transition-all duration-300
            ${s.fired
              ? s.hasBullet
                ? 'bg-red-900/60 border-red-700 shadow-[0_0_4px_rgba(220,38,38,0.6)]'
                : 'bg-zinc-900 border-zinc-700 opacity-40'
              : isPlayer
                ? 'bg-emerald-900/30 border-emerald-700 shadow-[0_0_3px_rgba(52,211,153,0.3)]'
                : 'bg-red-900/20 border-red-900'
            }
          `}
        >
          {s.fired && s.hasBullet && (
            <span className="text-[6px] text-red-400">✕</span>
          )}
          {s.fired && !s.hasBullet && (
            <span className="text-[6px] text-zinc-600">·</span>
          )}
          {!s.fired && (
            <span className={`text-[5px] ${isPlayer ? 'text-emerald-600' : 'text-red-800'}`}>○</span>
          )}
        </div>
      ))}
    </div>
    {/* 剩余机会计数 */}
    <span className={`font-pixel text-[6px] ${isPlayer ? 'text-emerald-800' : 'text-red-900'}`}>
      {slots.filter(s => !s.fired).length}/6
    </span>
  </div>
);

// 乱码文字组件 —— 模拟对手正在输入的样子
const ScrambledText: React.FC<{ length: number }> = ({ length }) => {
  const [chars, setChars] = useState<string[]>([]);
  const POOL = '田由甲申甴电甶男甸甹町画甼甽甾甿畀畁畂畃畄畅畆畇畈畉畊畋界畍畎畏畐畑';

  useEffect(() => {
    const gen = () => Array.from({ length: Math.max(length, 2) }, () =>
      POOL[Math.floor(Math.random() * POOL.length)]
    );
    setChars(gen());
    const id = setInterval(() => setChars(gen()), 120);
    return () => clearInterval(id);
  }, [length]);

  return (
    <span className="tracking-widest text-violet-400 font-bold text-lg select-none blur-[1px]">
      {chars.join('')}
    </span>
  );
};

type ValidatePhase = 'idle' | 'validating' | 'done';

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
  isOnlineMode = false,
  isYourTurn = true,
  opponentInput,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [timeLeft, setTimeLeft] = useState(timerMax);
  const [videoEvent, setVideoEvent] = useState<VideoEvent>('idle');
  const [errorInfo, setErrorInfo] = useState<FunnyError | null>(null);
  const [errorKey, setErrorKey] = useState(0);
  const [phase, setPhase] = useState<'input' | 'success'>('input');
  const [validatePhase, setValidatePhase] = useState<ValidatePhase>('idle');
  const [validateMsg, setValidateMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutCalledRef = useRef(false);
  const errorClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 重置状态（每轮开始时）
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
    // 自己回合时自动聚焦
    if (isYourTurn) setTimeout(() => inputRef.current?.focus(), 100);
  }, [currentIdiom, isYourTurn]);

  // 对手回合时视频显示 thinking
  useEffect(() => {
    if (isOnlineMode && !isYourTurn) {
      setVideoEvent('thinking');
    } else {
      setVideoEvent('idle');
    }
  }, [isOnlineMode, isYourTurn]);

  // 倒计时
  useEffect(() => {
    if (phase !== 'input') return;
    if (frozen) return;
    if (isOnlineMode && !isYourTurn) return; // 对手回合不计时
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          handleTimeout();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentIdiom, timerMax, frozen, isYourTurn]);

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleTimeout = useCallback(() => {
    if (timeoutCalledRef.current) return;
    timeoutCalledRef.current = true;
    stopTimer();
    setPhase('success');
    setVideoEvent('timeout');
    const err = getRandomError('timeout');
    setErrorInfo(err);
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
    if (phase !== 'input') return;
    if (isSubmitting) return;
    if (timeoutCalledRef.current) return;
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    setValidatePhase('validating');
    setValidateMsg(`正在验证「${trimmed}」…`);
    setVideoEvent('thinking');

    try {
      const result = await validateIdiomWithAI(trimmed);
      setValidatePhase('done');
      setValidateMsg('');

      if (!result.isIdiom) {
        setIsSubmitting(false);
        showErrorAndResume(getRandomError('not-idiom'));
        return;
      }

      const inputFirst = { char: result.firstChar,   pinyin: result.firstPinyin };
      const prevLast   = { char: currentIdiom.text.slice(-1), pinyin: currentIdiom.last };

      if (!isValidChainAI(inputFirst, prevLast)) {
        setIsSubmitting(false);
        showErrorAndResume(getRandomError('wrong-chain'));
        return;
      }

      setPhase('success');
      stopTimer();
      setVideoEvent('correct');
      setErrorInfo(null);
      const successIdiom: Idiom = {
        text: trimmed,
        first: result.firstPinyin,
        last: result.lastPinyin,
      };
      setTimeout(() => onCorrect(successIdiom), 1600);

    } catch {
      setValidatePhase('done');
      setValidateMsg('');

      const { findIdiom, isValidChain } = await import('../data/idioms');
      const found = findIdiom(trimmed);

      if (!found) {
        setIsSubmitting(false);
        showErrorAndResume(getRandomError('not-idiom'));
        return;
      }
      if (!isValidChain(found, currentIdiom)) {
        setIsSubmitting(false);
        showErrorAndResume(getRandomError('wrong-chain'));
        return;
      }

      setPhase('success');
      stopTimer();
      setVideoEvent('correct');
      setErrorInfo(null);
      setTimeout(() => onCorrect(found), 1600);
    }
  }, [phase, isSubmitting, inputValue, currentIdiom, onCorrect, showErrorAndResume]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const timerPct = (timeLeft / timerMax) * 100;
  const timerDanger = timeLeft <= Math.ceil(timerMax * 0.3);
  const isValidating = validatePhase === 'validating';
  // 是否禁用输入：成功状态 / API调用中 / 非自己回合 / frozen
  const isMyTurn = !isOnlineMode || isYourTurn;
  const inputDisabled = phase === 'success' || isValidating || !isMyTurn || frozen;

  return (
    <div className="min-h-screen bg-[#0a1410] text-emerald-400 flex flex-col font-cn">

      {/* ══ 顶部状态栏 ══ */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-emerald-900/50 bg-black/60 shrink-0 gap-3">

        {/* 左：玩家子弹槽 */}
        <div className="flex flex-col gap-1 min-w-[90px]">
          <span className="font-pixel text-[6px] text-emerald-800">1P 你</span>
          {playerSlots
            ? <BulletSlotsBar slots={playerSlots} label="" isPlayer={true} />
            : <span className="font-pixel text-[6px] text-emerald-800">♥ ♥ ♥</span>
          }
        </div>

        {/* 中：倒计时 + 回合信息 */}
        <div className="flex flex-col items-center gap-1 flex-1 max-w-[160px]">
          <div className="flex items-center gap-2 w-full">
            <div className="flex-1 h-2.5 border border-emerald-800 bg-black overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${timerDanger ? 'bg-red-600' : 'bg-emerald-500'}`}
                style={{
                  width: `${timerPct}%`,
                  boxShadow: timerDanger ? '0 0 6px rgba(220,38,38,0.8)' : '0 0 4px rgba(52,211,153,0.5)',
                }}
              />
            </div>
            <span className={`font-pixel text-[11px] min-w-[20px] text-right tabular-nums ${timerDanger ? 'text-red-400 animate-blink' : 'text-emerald-400'}`}>
              {(frozen || (isOnlineMode && !isYourTurn)) ? '—' : timeLeft}
            </span>
          </div>
          <div className="font-pixel text-[6px] text-emerald-900">
            回合 {String(round).padStart(2,'0')} · VS {opponentName}
          </div>
        </div>

        {/* 右：AI子弹槽 + 退出按钮 */}
        <div className="flex flex-col gap-1 items-end min-w-[90px]">
          <div className="flex items-center gap-2">
            <span className="font-pixel text-[6px] text-red-900">2P {opponentName}</span>
            {onQuit && (
              <button
                onClick={onQuit}
                className="
                  ml-1 px-1.5 py-0.5 font-pixel text-[7px] tracking-wider
                  border border-red-900/60 bg-red-950/40 text-red-700
                  hover:bg-red-900/50 hover:border-red-700 hover:text-red-400
                  active:scale-95 transition-all
                "
                title="退出游戏"
              >
                ✕ 退出
              </button>
            )}
          </div>
          {aiSlots
            ? <BulletSlotsBar slots={aiSlots} label="" isPlayer={false} />
            : <span className="font-pixel text-[6px] text-red-900">♥ ♥ ♥</span>
          }
        </div>
      </div>

      {/* ══ 接龙输入区（顶部，紧贴状态栏） ══ */}
      <div className={`shrink-0 border-b-2 px-4 py-3 space-y-2.5 transition-colors
        ${isMyTurn
          ? 'border-emerald-800/60 bg-[#0d1f18]'
          : 'border-violet-900/60 bg-[#0d0f1f]'
        }
      `}>

        {/* 联网模式 —— 回合指示横幅 */}
        {isOnlineMode && (
          <div className={`
            flex items-center gap-2 py-1 px-2 text-[8px] font-pixel tracking-widest border
            ${isYourTurn
              ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-500'
              : 'bg-violet-950/30 border-violet-800/40 text-violet-500 animate-pulse'
            }
          `}>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-current" />
            {isYourTurn ? '⚔ 你的回合 — 输入成语接龙' : `⏳ 等待 ${opponentName} 接龙…`}
            <span className="ml-auto opacity-40">ONLINE</span>
          </div>
        )}

        {/* 当前需接的成语 */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-pixel text-[8px] text-emerald-700 shrink-0">当前词：</span>
          <div className="flex gap-1">
            {currentIdiom.text.split('').map((ch, i) => (
              <span
                key={i}
                className={`inline-flex items-center justify-center w-9 h-9 border text-lg font-bold
                  ${i === currentIdiom.text.length - 1
                    ? 'border-yellow-600 bg-yellow-900/30 text-yellow-300'
                    : 'border-emerald-800 bg-emerald-900/20 text-emerald-300'
                  }`}
              >
                {ch}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1 text-xs text-emerald-700 ml-1">
            <span>→ 末：</span>
            <span className="text-yellow-400 font-bold text-base">{currentIdiom.text.slice(-1)}</span>
            <span className="font-pixel text-[7px] text-emerald-800">({currentIdiom.last})</span>
          </div>
        </div>

        {/* 输入框区域 */}
        {isMyTurn ? (
          /* 自己的回合：正常输入框 */
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={e => {
                if (phase === 'input') setInputValue(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              maxLength={8}
              placeholder={`首字同「${currentIdiom.text.slice(-1)}」字或同「${currentIdiom.last}」音…`}
              disabled={inputDisabled}
              className="
                flex-1 bg-black/50 border-2 border-emerald-700 text-emerald-300
                px-3 py-2.5 text-lg tracking-widest font-cn
                placeholder:text-emerald-900 outline-none
                focus:border-emerald-400 focus:shadow-[0_0_12px_rgba(52,211,153,0.3)]
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-all
              "
            />
            <button
              onClick={handleSubmit}
              disabled={inputDisabled || !inputValue.trim()}
              className="
                px-5 py-2.5 bg-emerald-900/50 border-2 border-emerald-600 text-emerald-300
                hover:bg-emerald-800/50 hover:border-emerald-400
                active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed
                transition-all text-sm tracking-widest font-bold
              "
            >
              {isValidating ? '验证…' : '接龙 ↵'}
            </button>
          </div>
        ) : (
          /* 对手回合：乱码显示区域 */
          <div className="flex gap-2 items-center">
            <div className="
              flex-1 bg-violet-950/30 border-2 border-violet-900/50 text-violet-400
              px-3 py-2.5 flex items-center gap-3 min-h-[48px]
            ">
              <span className="font-pixel text-[7px] text-violet-700 shrink-0">对方输入中</span>
              <div className="flex-1">
                {opponentInput && opponentInput.length > 0 ? (
                  <ScrambledText length={opponentInput.length} />
                ) : (
                  <span className="text-violet-800 text-sm font-pixel tracking-widest animate-pulse">
                    ···
                  </span>
                )}
              </div>
            </div>
            <div className="px-5 py-2.5 bg-violet-950/20 border-2 border-violet-900/40 text-violet-800 text-sm tracking-widest font-pixel cursor-not-allowed select-none">
              等待中
            </div>
          </div>
        )}

        <div className="font-pixel text-[7px] text-emerald-900">
          {isMyTurn
            ? `按 Enter 提交 │ AI 实时验证成语 │ 超时或接错 → 轮盘赌`
            : `等待 ${opponentName} 接龙中…请勿离开`
          }
        </div>
      </div>

      {/* ══ 16:9 视频区域 ══ */}
      <div className="relative flex-1 min-h-0 flex flex-col">
        <VideoScene event={videoEvent} className="w-full" />

        {/* 对手名字标签（叠加在视频上） */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div className="bg-black/70 border border-emerald-800 px-3 py-1 text-[11px] text-emerald-500 font-pixel tracking-wider">
            {opponentName}
          </div>
        </div>

        {/* 验证中 Loading */}
        {isValidating && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
            <div className="bg-black/85 border border-emerald-700 px-6 py-4 flex flex-col items-center gap-3">
              <div className="flex gap-2">
                {[0, 0.2, 0.4].map((d, i) => (
                  <div
                    key={i}
                    className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-bounce"
                    style={{ animationDelay: `${d}s` }}
                  />
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
          <div
            key={errorKey}
            className="absolute top-2 left-2 right-2 z-20 pointer-events-none animate-slide-up"
          >
            <div
              className="bg-red-950/95 border border-red-700 px-4 py-2.5 flex items-start gap-3"
              style={{ boxShadow: '0 0 16px rgba(220,38,38,0.35)' }}
            >
              <div className="w-1 self-stretch bg-red-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-pixel text-[7px] text-red-500 tracking-widest mb-0.5">{errorInfo.article}</div>
                <div className="text-red-300 text-sm font-bold leading-snug truncate">{errorInfo.title}</div>
                <p className="text-zinc-500 text-xs leading-tight mt-0.5 line-clamp-2">{errorInfo.body}</p>
              </div>
              <div className="font-pixel text-[6px] text-red-800 animate-blink shrink-0 text-right">
                ⚠ 继续<br/>输入
              </div>
            </div>
          </div>
        )}

        {/* 底部状态栏 */}
        <div className="flex items-center justify-between px-4 py-1.5 border-t border-emerald-900/50 bg-black/60 text-[8px] font-pixel text-emerald-800 shrink-0 mt-auto">
          <span className={timerDanger && isMyTurn ? 'text-red-600 animate-blink' : ''}>
            {timerDanger && isMyTurn ? '⚠ 危险！' : '♥ ♥ ♥'}
          </span>
          <span className="text-emerald-900">智谱 GLM-4-Flash 实时验证</span>
          {onQuit && (
            <button
              onClick={onQuit}
              className="text-red-900 hover:text-red-600 transition-colors cursor-pointer"
            >
              █ 退出游戏
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameScreen;
