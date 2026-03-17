import React, { useState, useEffect } from 'react';

export type OppState =
  | 'opp-intro' | 'opp-idle' | 'opp-thinking'
  | 'opp-correct' | 'opp-wrong' | 'opp-timeout'
  | 'opp-roulette-watch' | 'opp-roulette-laugh'
  | 'opp-dead' | 'opp-win';

export type PlayerState =
  | 'player-idle' | 'player-typing'
  | 'player-roulette' | 'player-fire-empty'
  | 'player-fire-shot' | 'player-win';

export type BgState = 'bg-normal' | 'bg-danger';

interface Props {
  bgState: BgState;
  oppState: OppState;
  playerState: PlayerState;
}

const PixelScene: React.FC<Props> = ({ bgState, oppState, playerState }) => {
  // ── Opponent ──
  let oppClass = 'animate-bob';
  let eyeClass = 'h-3';
  let oppTransform = '';
  let oppOpacity = 'opacity-100';
  let armClass = 'translate-y-0';

  if (oppState === 'opp-intro')            { oppClass = 'transition-transform duration-1000 translate-y-0'; oppTransform = 'translateY(80px)'; }
  else if (oppState === 'opp-thinking')    { oppClass = 'scale-110 translate-y-4 transition-all duration-500'; eyeClass = 'h-1'; }
  else if (oppState === 'opp-correct')     { oppClass = 'animate-bang-table'; eyeClass = 'h-4'; armClass = 'translate-y-[-20px]'; }
  else if (oppState === 'opp-wrong')       { oppClass = 'animate-laugh'; eyeClass = 'h-1'; }
  else if (oppState === 'opp-timeout')     { oppClass = 'animate-bounce'; }
  else if (oppState === 'opp-roulette-watch') { oppClass = 'scale-110 transition-all duration-500'; eyeClass = 'h-5'; }
  else if (oppState === 'opp-roulette-laugh') { oppClass = 'animate-laugh'; eyeClass = 'h-2'; }
  else if (oppState === 'opp-dead')        { oppClass = 'rotate-90 translate-y-32 transition-all duration-1000'; oppOpacity = 'opacity-0'; }
  else if (oppState === 'opp-win')         { oppClass = 'animate-bounce'; armClass = 'translate-y-[-40px] rotate-180'; }

  // ── Player ──
  let leftHandClass = 'translate-y-10';
  let rightHandClass = 'translate-y-10';
  let gunClass = 'translate-y-full opacity-0';
  let gunSpin = '';
  let screenShake = '';
  let flashBang = false;

  if (playerState === 'player-typing') {
    leftHandClass  = 'animate-type-left';
    rightHandClass = 'animate-type-right';
  } else if (playerState === 'player-roulette') {
    leftHandClass  = 'translate-y-full';
    rightHandClass = 'translate-y-full';
    gunClass = 'translate-y-[-20px] rotate-0 transition-all duration-500';
    gunSpin  = 'animate-spin';
  } else if (playerState === 'player-fire-empty') {
    leftHandClass  = 'translate-y-full';
    rightHandClass = 'translate-y-full';
    gunClass = 'translate-y-[-20px] animate-gun-recoil';
  } else if (playerState === 'player-fire-shot') {
    leftHandClass  = 'translate-y-full';
    rightHandClass = 'translate-y-full';
    gunClass = 'translate-y-[-20px] animate-gun-recoil';
    screenShake = 'animate-screen-shake';
    flashBang = true;
  } else if (playerState === 'player-win') {
    leftHandClass  = 'translate-y-0 rotate-[-10deg]';
    rightHandClass = 'translate-y-0 rotate-[10deg]';
    gunClass = 'translate-y-full rotate-90 opacity-0 transition-all duration-1000';
  }

  // ── Background ──
  const bgClass = bgState === 'bg-danger' ? 'animate-bg-danger' : 'bg-zinc-900';

  const [key, setKey] = useState(0);
  useEffect(() => { setKey(p => p + 1); }, [bgState, oppState, playerState]);

  return (
    <div
      key={key}
      className={`absolute inset-0 overflow-hidden ${bgClass} ${screenShake} transition-colors duration-500`}
    >
      {/* Flash overlay */}
      {flashBang && (
        <div className="absolute inset-0 z-[100] pointer-events-none animate-flash-bang" />
      )}

      {/* Room top gradient */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-black/80 to-transparent" />

      {/* ── Opponent ── */}
      <div
        className={`absolute top-[8%] left-1/2 -translate-x-1/2 z-10 ${oppOpacity}`}
        style={oppTransform ? { transform: oppTransform } : undefined}
      >
        <div className={`relative flex flex-col items-center ${oppClass}`}>
          {/* Sack head */}
          <div className="w-32 h-40 bg-[#d4a373] rounded-t-[3rem] rounded-b-xl relative pixel-shadow border-4 border-[#8b5a2b]">
            {/* Eyes */}
            <div className="absolute top-16 left-6 w-16 flex justify-between">
              <div className={`w-4 bg-black rounded-full transition-all duration-200 ${eyeClass}`} />
              <div className={`w-4 bg-black rounded-full transition-all duration-200 ${eyeClass}`} />
            </div>
            {/* Rope */}
            <div className="absolute bottom-4 left-[-10px] w-[140px] h-4 bg-[#8b5a2b] rounded-full" />
            <div className="absolute bottom-0 left-10 w-4 h-8 bg-[#8b5a2b] rotate-12" />
          </div>
          {/* Body */}
          <div className="w-48 h-40 bg-[#e07a5f] rounded-t-3xl mt-[-10px] pixel-shadow border-4 border-[#9d4b35] relative z-[-1]">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-8 bg-[#f4a261] rounded-b-xl" />
            <div className={`absolute top-20 left-[-20px] w-12 h-32 bg-[#e07a5f] rounded-full origin-top transition-transform duration-300 ${armClass}`} />
            <div className={`absolute top-20 right-[-20px] w-12 h-32 bg-[#e07a5f] rounded-full origin-top transition-transform duration-300 ${armClass}`} />
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="absolute bottom-0 w-full h-[42%] bg-[#3e2723] border-t-8 border-[#271811] z-20 flex justify-center">
        {/* CRT Monitor */}
        <div className="absolute top-[-80px] w-72 h-56 bg-[#2b2d42] border-8 border-[#8d99ae] rounded-xl pixel-shadow flex items-center justify-center p-2">
          <div className="w-full h-full bg-[#0a0a0a] border-4 border-[#1a1a1a] rounded-lg p-3 flex flex-col relative overflow-hidden">
            <div className="text-emerald-400 font-mono text-xs leading-tight">
              <div className="flex justify-between mb-1 text-[10px]">
                <span>1P ▓▓▓</span>
                <span>2P ▓▓░</span>
              </div>
              <div id="monitor-idiom" className="text-center text-lg font-bold my-3 font-cn text-emerald-300 animate-pulse">
                成语死斗
              </div>
              <div className="border border-emerald-500/50 p-1 text-[10px]">
                <span className="animate-blink">█</span>
              </div>
            </div>
            <div className="absolute top-0 left-0 w-full h-1/2 bg-white/5 rounded-t-lg" />
          </div>
          <div className="absolute bottom-[-20px] w-32 h-6 bg-[#8d99ae] rounded-b-lg" />
        </div>
        {/* Keyboard */}
        <div className="absolute bottom-4 w-96 h-16 bg-[#2b2b2b] border-b-4 border-black rounded pixel-shadow-sm flex flex-wrap gap-1 p-2 justify-center">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="w-6 h-4 bg-[#1a1a1a] rounded-sm" />
          ))}
        </div>
      </div>

      {/* ── Player hands / gun ── */}
      <div className="absolute bottom-0 left-0 w-full h-full pointer-events-none z-30">
        {/* Left hand */}
        <div className={`absolute bottom-[-20px] left-[20%] w-20 h-32 bg-[#fbc4ab] border-4 border-[#d69f8e] rounded-t-3xl transition-transform duration-300 ${leftHandClass}`}>
          <div className="absolute top-[-10px] left-2 w-4 h-12 bg-[#fbc4ab] border-2 border-[#d69f8e] rounded-full" />
          <div className="absolute top-[-15px] left-8 w-4 h-14 bg-[#fbc4ab] border-2 border-[#d69f8e] rounded-full" />
        </div>
        {/* Right hand */}
        <div className={`absolute bottom-[-20px] right-[20%] w-20 h-32 bg-[#fbc4ab] border-4 border-[#d69f8e] rounded-t-3xl transition-transform duration-300 ${rightHandClass}`}>
          <div className="absolute top-[-15px] right-8 w-4 h-14 bg-[#fbc4ab] border-2 border-[#d69f8e] rounded-full" />
          <div className="absolute top-[-10px] right-2 w-4 h-12 bg-[#fbc4ab] border-2 border-[#d69f8e] rounded-full" />
        </div>
        {/* Revolver */}
        <div className={`absolute bottom-10 left-1/2 -translate-x-1/2 w-32 h-40 flex flex-col items-center ${gunClass}`}>
          <div className="w-6 h-20 bg-[#4a4e69] border-4 border-[#22223b] rounded-t-sm relative">
            <div className="absolute top-2 left-[-6px] w-2 h-4 bg-[#22223b]" />
          </div>
          <div className={`w-14 h-16 bg-[#9a8c98] border-4 border-[#4a4e69] rounded-lg mt-[-5px] flex justify-center items-center ${gunSpin} overflow-hidden`}>
            <div className="w-2 h-full bg-[#4a4e69]/30" />
            <div className="w-2 h-full bg-[#4a4e69]/30 ml-2" />
          </div>
          <div className="w-10 h-16 bg-[#8b5a2b] border-4 border-[#5c4033] rounded-b-xl mt-[-5px] rotate-[-15deg] origin-top" />
          <div className="absolute bottom-[-20px] w-24 h-24 bg-[#fbc4ab] border-4 border-[#d69f8e] rounded-full" />
        </div>
      </div>

      {/* CRT scanlines overlay */}
      <div className="absolute inset-0 z-50 pointer-events-none scanlines opacity-20 mix-blend-overlay" />
      {/* Vignette */}
      <div className="absolute inset-0 z-40 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.7)_100%)]" />
    </div>
  );
};

export default PixelScene;
