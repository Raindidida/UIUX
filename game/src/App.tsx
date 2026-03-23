import React, { useState, useCallback, useRef, useEffect } from 'react';
import HomeScreen, { Difficulty, DIFFICULTY_CONFIG } from './components/HomeScreen';
import GameScreen, { PendingRoulette } from './components/GameScreen';
import ResultScreen, { GameStats, loadBestRecord } from './components/ResultScreen';
import MatchmakingScreen from './components/MatchmakingScreen';
import {
  Idiom,
  getRandomStartIdiom,
  getChainCandidates,
} from './data/idioms';
import {
  connectSocket,
  disconnectSocket,
  emitMatchJoin,
  emitMatchCancel,
  emitGameSubmit,
  emitGameTimeout,
  onMatchFound,
  onMatchCancelled,
  onGameRoulette,
  onGameOver,
  onGameStateUpdate,
  onGameError,
  MatchFoundPayload,
  GameRoulettePayload,
  GameOverPayload,
  GameStateUpdatePayload,
} from './socket/socketClient';

// ── AI 难度配置 ──
interface AILevel {
  name: string;
  title: string;
  thinkDelay: number;
}

const AI_LEVELS: AILevel[] = [
  { name: '学童',  title: '初学乍练', thinkDelay: 700 },
  { name: '秀才',  title: '文采初现', thinkDelay: 500 },
  { name: '举人',  title: '融会贯通', thinkDelay: 400 },
  { name: '进士',  title: '出神入化', thinkDelay: 300 },
];

function computeFailRate(killCount: number): number {
  return Math.max(0.20, 0.50 - killCount * 0.075);
}

// ── 子弹槽：6格，位置1和4为真弹；记录哪些格已被"开过枪" ──
export interface BulletSlot {
  chamber: number;       // 0-5
  hasBullet: boolean;    // 是否为真弹
  fired: boolean;        // 是否已开过枪
}

function freshBulletSlots(): BulletSlot[] {
  return Array.from({ length: 6 }, (_, i) => ({
    chamber: i,
    hasBullet: i === 1 || i === 4,
    fired: false,
  }));
}

/** 随机选一个未开过的格，标记为已开，返回是否中弹 */
function fireOnce(slots: BulletSlot[]): { nextSlots: BulletSlot[]; hit: boolean; chamberId: number } {
  const available = slots.filter(s => !s.fired);
  if (available.length === 0) {
    // 全开完了，重置弹仓
    const reset = freshBulletSlots();
    const idx = Math.floor(Math.random() * reset.length);
    reset[idx].fired = true;
    return { nextSlots: reset, hit: reset[idx].hasBullet, chamberId: reset[idx].chamber };
  }
  const picked = available[Math.floor(Math.random() * available.length)];
  const next = slots.map(s =>
    s.chamber === picked.chamber ? { ...s, fired: true } : s
  );
  return { nextSlots: next, hit: picked.hasBullet, chamberId: picked.chamber };
}

type Screen =
  | 'home'
  | 'online-matching'
  | 'online-game'
  | 'game'
  | 'ai-turn'
  | 'result';

interface OnlineState {
  roomId: string;
  opponentName: string;
  yourTurn: boolean;
  playerName: string;
  difficulty: Difficulty;
}

interface AppState {
  screen: Screen;
  currentIdiom: Idiom;
  round: number;
  correctCount: number;
  wrongCount: number;
  chainHistory: string[];
  aiLevelIndex: number;
  killCount: number;
  isVictory: boolean;
  difficulty: Difficulty;
  playerSlots: BulletSlot[];   // 玩家弹仓
  aiSlots: BulletSlot[];       // AI弹仓
  // 轮盘（内嵌在游戏界面展示，不跳转独立页面）
  pendingRoulette?: PendingRoulette;
  // 联网模式
  online?: OnlineState;
  onlineWinner?: 'you' | 'opponent' | 'draw';
  onlineEndReason?: 'roulette' | 'opponent-left';
}

// ── AI 回合 Overlay（3s上限 + 结果展示） ──
type AITurnPhase = 'thinking' | 'show-result';

const AITurnOverlay: React.FC<{
  idiom: Idiom;
  aiName: string;
  failRate: number;
  thinkDelay: number;
  onSuccess: (next: Idiom) => void;
  onFail: () => void;
}> = ({ idiom, aiName, failRate, thinkDelay, onSuccess, onFail }) => {
  const doneRef = useRef(false);
  const [phase, setPhase] = useState<AITurnPhase>('thinking');
  const [resultIdiom, setResultIdiom] = useState<Idiom | null>(null);
  const [failed, setFailed] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // 倒计时 3s，到0强制出结果
  React.useEffect(() => {
    if (phase !== 'thinking') return;
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  // 在 thinkDelay（≤3000）后出结果，若超3s则由倒计时触发
  React.useEffect(() => {
    if (doneRef.current) return;
    const delay = Math.min(thinkDelay, 2800); // 最多2.8s，留0.2s动画
    const t = setTimeout(() => {
      if (doneRef.current) return;
      doneRef.current = true;
      const didFail = Math.random() < failRate;
      if (didFail) {
        setFailed(true);
        setPhase('show-result');
      } else {
        const candidates = getChainCandidates(idiom);
        const next = candidates.length > 0
          ? candidates[Math.floor(Math.random() * candidates.length)]
          : null;
        if (!next) {
          setFailed(true);
          setPhase('show-result');
        } else {
          setResultIdiom(next);
          setPhase('show-result');
        }
      }
    }, delay);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 展示结果后1.2s切换
  React.useEffect(() => {
    if (phase !== 'show-result') return;
    const t = setTimeout(() => {
      if (failed || !resultIdiom) onFail();
      else onSuccess(resultIdiom);
    }, 1200);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
      <div className={`
        border px-8 py-5 flex flex-col items-center gap-3 min-w-[220px]
        ${phase === 'show-result' && failed
          ? 'bg-red-950/95 border-red-700'
          : phase === 'show-result'
            ? 'bg-emerald-950/95 border-emerald-600'
            : 'bg-black/90 border-emerald-800'
        }
      `}>
        {phase === 'thinking' ? (
          <>
            <span className="text-2xl">🤖</span>
            <span className="font-pixel text-[8px] text-emerald-400 tracking-widest">{aiName} 思考中…</span>
            {/* 倒计时 */}
            <div className={`font-pixel text-[22px] font-black tabular-nums
              ${countdown <= 1 ? 'text-red-500 animate-blink' : 'text-yellow-400'}`}>
              {countdown}
            </div>
            <div className="flex gap-2">
              {[0, 0.15, 0.3].map((d, i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"
                  style={{ animationDelay: `${d}s` }} />
              ))}
            </div>
          </>
        ) : (
          <>
            {failed ? (
              <>
                <span className="text-3xl">😵</span>
                <span className="font-pixel text-[9px] text-red-400 tracking-widest">{aiName} 接不上！</span>
                <span className="font-pixel text-[7px] text-red-700">触发轮盘惩罚…</span>
              </>
            ) : (
              <>
                <span className="text-3xl">✅</span>
                <span className="font-pixel text-[8px] text-emerald-400 tracking-widest">{aiName} 接龙成功！</span>
                {resultIdiom && (
                  <div className="flex gap-1 mt-1">
                    {resultIdiom.text.split('').map((ch, i) => (
                      <span key={i} className={`
                        inline-flex items-center justify-center w-9 h-9 border text-lg font-bold
                        ${i === 0 ? 'border-emerald-500 bg-emerald-900/40 text-emerald-200'
                                  : 'border-emerald-800 bg-emerald-950 text-emerald-400'}
                      `}>{ch}</span>
                    ))}
                  </div>
                )}
                <span className="font-pixel text-[7px] text-emerald-800">轮到你接龙…</span>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ── App ──
const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({
    screen: 'home',
    currentIdiom: getRandomStartIdiom(),
    round: 0,
    correctCount: 0,
    wrongCount: 0,
    chainHistory: [],
    aiLevelIndex: 0,
    killCount: 0,
    isVictory: false,
    difficulty: 'normal',
    playerSlots: freshBulletSlots(),
    aiSlots: freshBulletSlots(),
  });

  const bestRecord = loadBestRecord();

  // ── 联网模式：Socket 事件监听 ──
  // 用 ref 存储当前 appState，避免事件回调中闭包过期
  const appStateRef = useRef(appState);
  useEffect(() => { appStateRef.current = appState; }, [appState]);

  // 存储 pending 的联网 playerName（在匹配成功前保留）
  const pendingOnlineRef = useRef<{ playerName: string; difficulty: Difficulty } | null>(null);

  useEffect(() => {
    // 匹配成功
    const offFound = onMatchFound((data: MatchFoundPayload) => {
      const pn = pendingOnlineRef.current?.playerName ?? '我';
      setAppState(prev => ({
        ...prev,
        screen: 'online-game',
        currentIdiom: data.currentIdiom,
        round: 1,
        correctCount: 0,
        wrongCount: 0,
        chainHistory: [data.currentIdiom.text],
        difficulty: data.difficulty,
        playerSlots: data.playerSlots as BulletSlot[],
        aiSlots: data.opponentSlots as BulletSlot[],  // aiSlots 复用为 opponentSlots
        online: {
          roomId: data.roomId,
          opponentName: data.opponentName,
          yourTurn: data.firstTurn,
          playerName: pn,
          difficulty: data.difficulty,
        },
      }));
    });

    // 轮盘赌结果（服务端仲裁）— 不跳转独立页面，直接在游戏界面显示浮层
    const offRoulette = onGameRoulette((data: GameRoulettePayload) => {
      const target: 'player' | 'ai' = data.target === 'you' ? 'player' : 'ai';
      setAppState(prev => ({
        ...prev,
        playerSlots: data.playerSlots as BulletSlot[],
        aiSlots: data.opponentSlots as BulletSlot[],
        pendingRoulette: { target, hit: data.hit, chamber: data.chamber ?? 0 },
      }));
    });

    // 游戏结束
    const offOver = onGameOver((data: GameOverPayload) => {
      setAppState(prev => ({
        ...prev,
        screen: 'result',
        isVictory: data.winner === 'you',
        chainHistory: data.stats.chainHistory,
        round: data.stats.rounds,
        onlineWinner: data.winner,
        onlineEndReason: data.reason,
      }));
    });

    // 服务端游戏状态同步
    const offUpdate = onGameStateUpdate((data: GameStateUpdatePayload) => {
      setAppState(prev => ({
        ...prev,
        currentIdiom: data.currentIdiom,
        round: data.round,
        playerSlots: data.playerSlots as BulletSlot[],
        aiSlots: data.opponentSlots as BulletSlot[],
        online: prev.online
          ? { ...prev.online, yourTurn: data.yourTurn }
          : prev.online,
      }));
    });

    // 服务端错误
    const offError = onGameError((data) => {
      console.warn('[GameError]', data.message);
    });

    // 匹配取消
    const offCancelled = onMatchCancelled(() => {
      setAppState(prev => ({ ...prev, screen: 'home' }));
      disconnectSocket();
    });

    return () => {
      offFound();
      offRoulette();
      offOver();
      offUpdate();
      offError();
      offCancelled();
    };
  }, []);

  const handleStart = useCallback((difficulty: Difficulty) => {
    const start = getRandomStartIdiom();
    setAppState({
      screen: 'game',
      currentIdiom: start,
      round: 1,
      correctCount: 0,
      wrongCount: 0,
      chainHistory: [start.text],
      aiLevelIndex: 0,
      killCount: 0,
      isVictory: false,
      difficulty,
      playerSlots: freshBulletSlots(),
      aiSlots: freshBulletSlots(),
    });
  }, []);

  // ── 联网模式：开始匹配 ──
  const handleOnlineMatch = useCallback((playerName: string, difficulty: Difficulty) => {
    pendingOnlineRef.current = { playerName, difficulty };
    connectSocket();
    emitMatchJoin(playerName, difficulty);
    setAppState(prev => ({
      ...prev,
      screen: 'online-matching',
      difficulty,
    }));
  }, []);

  // ── 联网模式：取消匹配 ──
  const handleCancelMatch = useCallback(() => {
    emitMatchCancel();
    disconnectSocket();
    pendingOnlineRef.current = null;
    setAppState(prev => ({ ...prev, screen: 'home' }));
  }, []);

  // ── 联网模式：玩家提交成语（发送给服务端验证） ──
  const handleOnlineCorrect = useCallback((inputIdiom: Idiom) => {
    const state = appStateRef.current;
    if (!state.online) return;
    // 更新本地状态（乐观更新），等待服务端确认
    emitGameSubmit(state.online.roomId, inputIdiom.text);
    setAppState(prev => ({
      ...prev,
      correctCount: prev.correctCount + 1,
      chainHistory: [...prev.chainHistory, inputIdiom.text],
      online: prev.online ? { ...prev.online, yourTurn: false } : prev.online,
    }));
  }, []);

  // ── 联网模式：超时惩罚 ──
  const handleOnlinePenalty = useCallback((_type: 'not-idiom' | 'wrong-chain' | 'timeout') => {
    const state = appStateRef.current;
    if (!state.online) return;
    emitGameTimeout(state.online.roomId);
    setAppState(prev => ({
      ...prev,
      wrongCount: prev.wrongCount + 1,
    }));
  }, []);

  // ── 联网模式：轮盘动画结束（服务端已仲裁，仅清除浮层）──
  const handleOnlineRouletteResult = useCallback((_target: 'player' | 'ai', _survived: boolean) => {
    setAppState(prev => ({ ...prev, pendingRoulette: undefined }));
  }, []);

  const handlePlayerCorrect = useCallback((inputIdiom: Idiom) => {
    setAppState(prev => ({
      ...prev,
      screen: 'ai-turn',
      currentIdiom: inputIdiom,
      correctCount: prev.correctCount + 1,
      chainHistory: [...prev.chainHistory, inputIdiom.text],
    }));
  }, []);

  const handlePlayerPenalty = useCallback((_type: 'not-idiom' | 'wrong-chain' | 'timeout') => {
    setAppState(prev => {
      const { nextSlots, hit, chamberId } = fireOnce(prev.playerSlots);
      return {
        ...prev,
        wrongCount: prev.wrongCount + 1,
        playerSlots: nextSlots,
        pendingRoulette: { target: 'player', hit, chamber: chamberId },
      };
    });
  }, []);

  // ── 统一轮盘完成回调（离线模式）──
  const handleRouletteComplete = useCallback((target: 'player' | 'ai', survived: boolean) => {
    setAppState(prev => {
      const base = { ...prev, pendingRoulette: undefined };
      if (target === 'player') {
        if (!survived) {
          return { ...base, screen: 'result' as Screen, isVictory: false };
        } else {
          return {
            ...base,
            screen: 'ai-turn' as Screen,
            round: prev.round + 1,
            chainHistory: [...prev.chainHistory, `[玩家失败→AI接] ${prev.currentIdiom.text}`],
          };
        }
      } else {
        // AI 轮盘
        if (!survived) {
          const newKillCount = prev.killCount + 1;
          const nextIndex = prev.aiLevelIndex + 1;
          if (nextIndex >= AI_LEVELS.length) {
            return { ...base, screen: 'result' as Screen, isVictory: true, killCount: newKillCount };
          }
          const newIdiom = getRandomStartIdiom();
          return {
            ...base,
            screen: 'game' as Screen,
            aiLevelIndex: nextIndex,
            killCount: newKillCount,
            aiSlots: freshBulletSlots(),
            playerSlots: freshBulletSlots(),
            currentIdiom: newIdiom,
            round: prev.round + 1,
            chainHistory: [...prev.chainHistory, `[换对手] ${newIdiom.text}`],
          };
        } else {
          return {
            ...base,
            screen: 'game' as Screen,
            round: prev.round + 1,
            chainHistory: [...prev.chainHistory, `[AI失败→玩家接] ${prev.currentIdiom.text}`],
          };
        }
      }
    });
  }, []);

  const handleAISuccess = useCallback((next: Idiom) => {
    setAppState(prev => ({
      ...prev,
      screen: 'game',
      currentIdiom: next,
      round: prev.round + 1,
      chainHistory: [...prev.chainHistory, next.text],
    }));
  }, []);

  const handleAIFail = useCallback(() => {
    setAppState(prev => {
      const { nextSlots, hit, chamberId } = fireOnce(prev.aiSlots);
      return {
        ...prev,
        screen: 'ai-turn' as Screen,  // 保持在 ai-turn，AITurnOverlay 会自然消失，GameScreen 展示轮盘
        aiSlots: nextSlots,
        pendingRoulette: { target: 'ai', hit, chamber: chamberId },
      };
    });
  }, []);

  const handleRetry = useCallback(() => {
    if (appState.online) {
      // 联网模式结束后重新匹配
      const { playerName, difficulty } = appState.online;
      handleOnlineMatch(playerName, difficulty);
    } else {
      handleStart(appState.difficulty);
    }
  }, [handleStart, handleOnlineMatch, appState.difficulty, appState.online]);

  const handleHome = useCallback(() => {
    // 如果是联网模式，断开连接
    if (appState.online || appState.screen === 'online-matching' || appState.screen === 'online-game') {
      disconnectSocket();
      pendingOnlineRef.current = null;
    }
    setAppState(prev => ({ ...prev, screen: 'home', online: undefined }));
  }, [appState.online, appState.screen]);

  const currentAI = AI_LEVELS[appState.aiLevelIndex] ?? AI_LEVELS[AI_LEVELS.length - 1];
  const currentFailRate = computeFailRate(appState.killCount);

  const gameStats: GameStats = {
    rounds: appState.round,
    correctCount: appState.correctCount,
    wrongCount: appState.wrongCount,
    isVictory: appState.isVictory,
    opponentName: currentAI.name,
    chainHistory: appState.chainHistory.slice(1),
  };

  switch (appState.screen) {
    case 'home':
      return (
        <HomeScreen
          onStart={handleStart}
          onOnlineMatch={handleOnlineMatch}
          bestRecord={bestRecord}
        />
      );

    case 'online-matching':
      return (
        <MatchmakingScreen
          playerName={pendingOnlineRef.current?.playerName ?? '匿名侠客'}
          difficulty={appState.difficulty}
          onCancel={handleCancelMatch}
        />
      );

    case 'online-game':
      return (
        <GameScreen
          currentIdiom={appState.currentIdiom}
          round={appState.round}
          opponentName={appState.online?.opponentName ?? '对手'}
          timerMax={DIFFICULTY_CONFIG[appState.difficulty].seconds}
          playerSlots={appState.playerSlots}
          aiSlots={appState.aiSlots}
          onCorrect={handleOnlineCorrect}
          onPenalty={handleOnlinePenalty}
          onQuit={handleHome}
          onRouletteComplete={handleOnlineRouletteResult}
          isOnlineMode={true}
          isYourTurn={appState.online?.yourTurn ?? false}
          pendingRoulette={appState.pendingRoulette}
        />
      );

    case 'game':
      return (
        <GameScreen
          currentIdiom={appState.currentIdiom}
          round={appState.round}
          opponentName={currentAI.name}
          timerMax={DIFFICULTY_CONFIG[appState.difficulty].seconds}
          playerSlots={appState.playerSlots}
          aiSlots={appState.aiSlots}
          onCorrect={handlePlayerCorrect}
          onPenalty={handlePlayerPenalty}
          onQuit={handleHome}
          onRouletteComplete={handleRouletteComplete}
          isYourTurn={true}
          pendingRoulette={appState.pendingRoulette}
        />
      );

    case 'ai-turn':
      return (
        <>
          <GameScreen
            currentIdiom={appState.currentIdiom}
            round={appState.round}
            opponentName={currentAI.name}
            timerMax={DIFFICULTY_CONFIG[appState.difficulty].seconds}
            frozen={true}
            playerSlots={appState.playerSlots}
            aiSlots={appState.aiSlots}
            onCorrect={handlePlayerCorrect}
            onPenalty={handlePlayerPenalty}
            onQuit={handleHome}
            onRouletteComplete={handleRouletteComplete}
            isYourTurn={false}
            pendingRoulette={appState.pendingRoulette}
          />
          <AITurnOverlay
            idiom={appState.currentIdiom}
            aiName={currentAI.name}
            failRate={currentFailRate}
            thinkDelay={currentAI.thinkDelay}
            onSuccess={handleAISuccess}
            onFail={handleAIFail}
          />
        </>
      );

    case 'result':
      return (
        <ResultScreen
          stats={appState.online
            ? {
                rounds: appState.round,
                correctCount: appState.correctCount,
                wrongCount: appState.wrongCount,
                isVictory: appState.isVictory,
                opponentName: `${appState.online.opponentName}（联网）`,
                chainHistory: appState.chainHistory.slice(1),
              }
            : gameStats
          }
          onRetry={handleRetry}
          onHome={handleHome}
          onlineEndReason={appState.onlineEndReason}
        />
      );

    default:
      return <HomeScreen onStart={handleStart} bestRecord={bestRecord} />;
  }
};

export default App;
