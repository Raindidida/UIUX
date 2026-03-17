import React, { useState, useEffect, useRef, useCallback } from 'react';
import PixelScene, { BgState, OppState, PlayerState } from './PixelScene';
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
}) => {
  const [inputValue, setInputValue] = useState('');
  const [timeLeft, setTimeLeft] = useState(timerMax);
  const [bgState, setBgState] = useState<BgState>('bg-normal');
  const [oppState, setOppState] = useState<OppState>('opp-idle');
  const [playerState, setPlayerState] = useState<PlayerState>('player-idle');
  const [errorInfo, setErrorInfo] = useState<FunnyError | null>(null);
  const [errorKey, setErrorKey] = useState(0);
  // phase 现在只有两种：'input'（可输入）和 'success'（接龙成功，锁定等待切换）
  // 错误不再切换 phase，直接短暂显示提示后恢复
  const [phase, setPhase] = useState<'input' | 'success'>('input');
  const [validatePhase, setValidatePhase] = useState<ValidatePhase>('idle');
  const [validateMsg, setValidateMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // API调用中禁止重复提交

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutCalledRef = useRef(false);
  const errorClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 重置状态（每轮开始时）
  useEffect(() => {
    setInputValue('');
    setTimeLeft(timerMax);
    setBgState('bg-normal');
    setOppState('opp-idle');
    setPlayerState('player-idle');
    setErrorInfo(null);
    setValidatePhase('idle');
    setValidateMsg('');
    setPhase('input');
    setIsSubmitting(false);
    timeoutCalledRef.current = false;
    if (errorClearRef.current) clearTimeout(errorClearRef.current);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [currentIdiom]);

  // 倒计时 —— 输入错误不暂停，全程运行直到归零
  useEffect(() => {
    if (phase !== 'input') return;
    if (frozen) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          handleTimeout();
          return 0;
        }
        if (t <= Math.ceil(timerMax * 0.3)) setBgState('bg-danger');
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentIdiom, timerMax, frozen]);

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // 倒计时归零 → 触发轮盘
  const handleTimeout = useCallback(() => {
    if (timeoutCalledRef.current) return;
    timeoutCalledRef.current = true;
    stopTimer();
    setPhase('success'); // 锁定输入
    setBgState('bg-danger');
    setOppState('opp-timeout');
    setPlayerState('player-idle');
    const err = getRandomError('timeout');
    setErrorInfo(err);
    setErrorKey(k => k + 1);
    setTimeout(() => onPenalty('timeout'), 2000);
  }, [onPenalty]);

  // 显示短暂错误后自动恢复输入（不触发轮盘）
  const showErrorAndResume = useCallback((err: FunnyError) => {
    setErrorInfo(err);
    setErrorKey(k => k + 1);
    setBgState('bg-normal');
    setOppState('opp-wrong');
    setPlayerState('player-idle');
    setInputValue(''); // 清空输入框方便重新输入
    // 1.2s 后自动清除错误提示，恢复正常状态
    if (errorClearRef.current) clearTimeout(errorClearRef.current);
    errorClearRef.current = setTimeout(() => {
      setErrorInfo(null);
      setOppState('opp-idle');
      setBgState(prev => prev === 'bg-danger' ? 'bg-danger' : 'bg-normal');
      inputRef.current?.focus();
    }, 1200);
  }, []);

  const handleSubmit = useCallback(async () => {
    // 锁定条件：成功状态、或正在验证中、或倒计时已归零
    if (phase !== 'input') return;
    if (isSubmitting) return;
    if (timeoutCalledRef.current) return;
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    setValidatePhase('validating');
    setValidateMsg(`正在验证「${trimmed}」…`);
    setOppState('opp-thinking');
    setPlayerState('player-typing');

    try {
      const result = await validateIdiomWithAI(trimmed);
      setValidatePhase('done');
      setValidateMsg('');

      if (!result.isIdiom) {
        // 不是成语 → 短暂提示，继续输入
        setIsSubmitting(false);
        showErrorAndResume(getRandomError('not-idiom'));
        return;
      }

      const inputFirst = { char: result.firstChar,   pinyin: result.firstPinyin };
      const prevLast   = { char: currentIdiom.text.slice(-1), pinyin: currentIdiom.last };

      if (!isValidChainAI(inputFirst, prevLast)) {
        // 接龙不符合 → 短暂提示，继续输入
        setIsSubmitting(false);
        showErrorAndResume(getRandomError('wrong-chain'));
        return;
      }

      // 接龙成功！锁定等待切换
      setPhase('success');
      stopTimer();
      setBgState('bg-normal');
      setOppState('opp-correct');
      setPlayerState('player-typing');
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

      // API失败 → 降级本地验证
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
      setBgState('bg-normal');
      setOppState('opp-correct');
      setPlayerState('player-typing');
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
  // 输入框禁用：只在成功状态或正在API调用时禁用，错误后恢复可用
  const inputDisabled = phase === 'success' || isValidating;

  return (
    <div className="min-h-screen bg-[#0a1410] text-emerald-400 flex flex-col font-cn">

      {/* ── 顶部信息栏 ── */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-emerald-900/50 bg-black/50 shrink-0 gap-3">

        {/* 左：玩家子弹槽 */}
        <div className="flex flex-col gap-1 min-w-[90px]">
          <span className="font-pixel text-[6px] text-emerald-800">1P 你</span>
          {playerSlots
            ? <BulletSlotsBar slots={playerSlots} label="" isPlayer={true} />
            : <span className="font-pixel text-[6px] text-emerald-800">♥ ♥ ♥</span>
          }
        </div>

        {/* 中：倒计时 */}
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
              {frozen ? '—' : timeLeft}
            </span>
          </div>
          <div className="font-pixel text-[6px] text-emerald-900">
            回合 {String(round).padStart(2,'0')} · VS {opponentName}
          </div>
        </div>

        {/* 右：AI子弹槽 */}
        <div className="flex flex-col gap-1 items-end min-w-[90px]">
          <span className="font-pixel text-[6px] text-red-900">2P {opponentName}</span>
          {aiSlots
            ? <BulletSlotsBar slots={aiSlots} label="" isPlayer={false} />
            : <span className="font-pixel text-[6px] text-red-900">♥ ♥ ♥</span>
          }
        </div>
      </div>

      {/* ── 游戏视口 ── */}
      <div className="relative w-full flex-1 min-h-0" style={{ minHeight: 320 }}>
        <PixelScene bgState={bgState} oppState={oppState} playerState={playerState} />

        {/* 对手名字标签 */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="bg-black/70 border border-emerald-800 px-3 py-1 text-[11px] text-emerald-500 font-pixel tracking-wider">
            {opponentName}
          </div>
        </div>

        {/* ── 验证中 Loading ── */}
        {isValidating && (
          <div className="absolute inset-0 z-60 flex items-center justify-center pointer-events-none">
            <div className="bg-black/80 border border-emerald-700 px-6 py-4 flex flex-col items-center gap-3 animate-slide-up">
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

        {/* 错误提示 —— 小横幅，不阻挡输入框，1.2s自动消失 */}
        {errorInfo && (
          <div
            key={errorKey}
            className="absolute top-2 left-2 right-2 z-60 pointer-events-none animate-slide-up"
          >
            <div
              className="bg-red-950/95 border border-red-700 px-4 py-2.5 flex items-start gap-3"
              style={{ boxShadow: '0 0 16px rgba(220,38,38,0.35)' }}
            >
              {/* 红色闪光条 */}
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
      </div>

      {/* ── 接龙输入区 ── */}
      <div className="shrink-0 border-t-2 border-emerald-900/60 bg-[#0d1f18] px-4 py-4 space-y-3">

        {/* 当前需接的成语 */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-pixel text-[8px] text-emerald-700 shrink-0">当前词：</span>
          <div className="flex gap-1">
            {currentIdiom.text.split('').map((ch, i) => (
              <span
                key={i}
                className={`inline-flex items-center justify-center w-10 h-10 border text-xl font-bold
                  ${i === currentIdiom.text.length - 1
                    ? 'border-yellow-600 bg-yellow-900/30 text-yellow-300'
                    : 'border-emerald-800 bg-emerald-900/20 text-emerald-300'
                  }`}
              >
                {ch}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1 text-xs text-emerald-700">
            <span>→ 末字：</span>
            <span className="text-yellow-400 font-bold text-base">{currentIdiom.text.slice(-1)}</span>
            <span className="font-pixel text-[7px] text-emerald-800">({currentIdiom.last})</span>
          </div>
        </div>

        {/* 接龙提示 */}
        <div className="font-pixel text-[7px] text-emerald-800 border-b border-emerald-900/40 pb-2">
          ── 首字与「{currentIdiom.text.slice(-1)}」<span className="text-yellow-800">同字</span>或<span className="text-emerald-700">同音({currentIdiom.last})</span>均可 ──
        </div>

        {/* 输入框 */}
        <div className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={e => {
              if (phase === 'input') {
                setInputValue(e.target.value);
                if (e.target.value.length > 0) {
                  setOppState('opp-thinking');
                  setPlayerState('player-typing');
                } else {
                  setOppState('opp-idle');
                  setPlayerState('player-idle');
                }
              }
            }}
            onKeyDown={handleKeyDown}
            maxLength={8}
            placeholder={`首字同「${currentIdiom.text.slice(-1)}」字或同「${currentIdiom.last}」音…`}
            disabled={inputDisabled}
            className="
              flex-1 bg-black/50 border-2 border-emerald-800 text-emerald-300
              px-4 py-3 text-lg tracking-widest font-cn
              placeholder:text-emerald-900 outline-none
              focus:border-emerald-500 focus:shadow-[0_0_12px_rgba(52,211,153,0.3)]
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-all
            "
          />
          <button
            onClick={handleSubmit}
            disabled={inputDisabled || !inputValue.trim()}
            className="
              px-6 py-3 bg-emerald-900/50 border-2 border-emerald-600 text-emerald-300
              hover:bg-emerald-800/50 hover:border-emerald-400
              active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed
              transition-all text-base tracking-widest font-bold
            "
          >
            {isValidating ? '验证…' : '接龙 ↵'}
          </button>
        </div>

        <div className="font-pixel text-[7px] text-emerald-900">
          按 Enter 提交 &nbsp;│&nbsp; AI 实时验证成语 &nbsp;│&nbsp; 超时或接错 → 轮盘赌
        </div>
      </div>

      {/* ── 底部状态栏 ── */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t border-emerald-900/50 bg-black/40 text-[8px] font-pixel text-emerald-800 shrink-0">
        <span className={timerDanger ? 'text-red-600 animate-blink' : ''}>
          {timerDanger ? '⚠ 危险！' : '♥ ♥ ♥'}
        </span>
        <span className="text-emerald-900">智谱 GLM-4-Flash 实时验证</span>
        <span>█ ESC 放弃</span>
      </div>
    </div>
  );
};

export default GameScreen;
