import React, { useState, useCallback, useRef, useEffect } from 'react';
import HomeScreen, { Difficulty, DIFFICULTY_CONFIG } from './components/HomeScreen';
import GameScreen from './components/GameScreen';
import RouletteScreen from './components/RouletteScreen';
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
  | 'roulette-player'
  | 'roulette-ai'
  | 'ai-killed'
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
  // 轮盘结果（传给 RouletteScreen 直接展示，不再自己随机）
  pendingRouletteHit?: boolean;
  pendingRouletteChamber?: number;
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

// ── AI 被击杀过渡页 ──
const AIKilledScreen: React.FC<{
  aiName: string;
  nextAiName: string | null;
  onContinue: () => void;
}> = ({ aiName, nextAiName, onContinue }) => {
  React.useEffect(() => {
    const t = setTimeout(onContinue, 2500);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-emerald-400 flex flex-col items-center justify-center gap-6 font-cn">
      <div className="text-6xl animate-bounce">💥</div>
      <div className="font-pixel text-[10px] text-red-500 tracking-widest animate-blink">
        {aiName} 已被击杀！
      </div>
      {nextAiName ? (
        <div className="text-center space-y-2">
          <div className="text-zinc-500 text-sm">下一位对手出现…</div>
          <div className="font-pixel text-[9px] text-yellow-400 tracking-widest">⚔ {nextAiName} 登场</div>
        </div>
      ) : (
        <div className="text-emerald-300 text-lg font-bold">全部对手已击败！</div>
      )}
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

    // 轮盘赌结果（服务端仲裁）
    const offRoulette = onGameRoulette((data: GameRoulettePayload) => {
      setAppState(prev => {
        const screen: Screen = data.target === 'you' ? 'roulette-player' : 'roulette-ai';
        return {
          ...prev,
          screen,
          playerSlots: data.playerSlots as BulletSlot[],
          aiSlots: data.opponentSlots as BulletSlot[],
          pendingRouletteHit: data.hit,
          pendingRouletteChamber: data.chamber,
        };
      });
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

  // ── 联网模式：轮盘结果（仅动画展示，服务端已仲裁，此处不影响状态） ──
  const handleOnlineRouletteResult = useCallback((_survived: boolean) => {
    // 结果已由服务端通过 game:over 或 game:state_update 告知
    // 此回调只需切回游戏界面等待下一步（若未结束）
    setAppState(prev => ({
      ...prev,
      screen: prev.screen === 'roulette-player' || prev.screen === 'roulette-ai'
        ? 'online-game'
        : prev.screen,
    }));
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
    // 预先计算轮盘结果，传给 RouletteScreen 直接展示
    setAppState(prev => {
      const { nextSlots, hit, chamberId } = fireOnce(prev.playerSlots);
      return {
        ...prev,
        screen: 'roulette-player',
        wrongCount: prev.wrongCount + 1,
        playerSlots: nextSlots,
        pendingRouletteHit: hit,
        pendingRouletteChamber: chamberId,
      };
    });
  }, []);

  const handlePlayerRouletteResult = useCallback((survived: boolean) => {
    if (!survived) {
      setAppState(prev => ({ ...prev, screen: 'result', isVictory: false }));
    } else {
      setAppState(prev => ({
        ...prev,
        screen: 'ai-turn',
        round: prev.round + 1,
        chainHistory: [...prev.chainHistory, `[玩家失败→AI接] ${prev.currentIdiom.text}`],
      }));
    }
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
        screen: 'roulette-ai',
        aiSlots: nextSlots,
        pendingRouletteHit: hit,
        pendingRouletteChamber: chamberId,
      };
    });
  }, []);

  const handleAIRouletteResult = useCallback((survived: boolean) => {
    if (!survived) {
      setAppState(prev => ({
        ...prev,
        screen: 'ai-killed',
        killCount: prev.killCount + 1,
        aiLevelIndex: Math.min(prev.aiLevelIndex + 1, AI_LEVELS.length - 1),
        aiSlots: freshBulletSlots(), // 击杀后新对手重置弹仓
      }));
    } else {
      setAppState(prev => ({
        ...prev,
        screen: 'game',
        round: prev.round + 1,
        chainHistory: [...prev.chainHistory, `[AI失败→玩家接] ${prev.currentIdiom.text}`],
      }));
    }
  }, []);

  const handleAIKilledContinue = useCallback(() => {
    setAppState(prev => {
      const nextIndex = prev.aiLevelIndex;
      if (nextIndex >= AI_LEVELS.length) {
        return { ...prev, screen: 'result', isVictory: true };
      }
      const newIdiom = getRandomStartIdiom();
      return {
        ...prev,
        screen: 'game',
        currentIdiom: newIdiom,
        round: prev.round + 1,
        chainHistory: [...prev.chainHistory, `[换对手] ${newIdiom.text}`],
        playerSlots: freshBulletSlots(), // 换对手时玩家弹仓也重置
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
          frozen={!appState.online?.yourTurn}
          playerSlots={appState.playerSlots}
          aiSlots={appState.aiSlots}
          onCorrect={handleOnlineCorrect}
          onPenalty={handleOnlinePenalty}
          isOnlineMode={true}
          isYourTurn={appState.online?.yourTurn ?? false}
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

    case 'roulette-player':
      return (
        <RouletteScreen
          target="player"
          opponentName={appState.online?.opponentName ?? currentAI.name}
          presetHit={appState.pendingRouletteHit}
          presetChamber={appState.pendingRouletteChamber}
          playerSlots={appState.playerSlots}
          aiSlots={appState.aiSlots}
          onResult={appState.online ? handleOnlineRouletteResult : handlePlayerRouletteResult}
        />
      );

    case 'roulette-ai':
      return (
        <RouletteScreen
          target="ai"
          opponentName={appState.online?.opponentName ?? currentAI.name}
          presetHit={appState.pendingRouletteHit}
          presetChamber={appState.pendingRouletteChamber}
          playerSlots={appState.playerSlots}
          aiSlots={appState.aiSlots}
          onResult={appState.online ? handleOnlineRouletteResult : handleAIRouletteResult}
        />
      );

    case 'ai-killed': {
      const nextIndex = appState.aiLevelIndex;
      const nextAI = nextIndex < AI_LEVELS.length ? AI_LEVELS[nextIndex] : null;
      return (
        <AIKilledScreen
          aiName={AI_LEVELS[Math.max(0, appState.aiLevelIndex - 1)].name}
          nextAiName={nextAI ? `${nextAI.name}（${nextAI.title}）` : null}
          onContinue={handleAIKilledContinue}
        />
      );
    }

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
