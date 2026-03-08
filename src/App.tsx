/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Skull, Zap, AlertTriangle, RefreshCw, ChevronRight, Heart, Ghost } from 'lucide-react';
import { generateNextStage, GameState, GameChoice } from './services/geminiService';
import ReactMarkdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type GameStatus = 'AUTH' | 'START' | 'PLAYING' | 'LOADING' | 'GAMEOVER' | 'VICTORY';

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    stage: 0,
    abyssGauge: 50,
    story: '',
    choices: [],
    history: []
  });
  const [status, setStatus] = useState<GameStatus>('AUTH');
  const [error, setError] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = import.meta.env.VITE_GAME_PASSWORD;
    
    // If password is not set in env, allow any password or just bypass
    if (!correctPassword || passwordInput === correctPassword) {
      setStatus('START');
      setAuthError(false);
    } else {
      setAuthError(true);
      setPasswordInput('');
    }
  };

  const startGame = async (location: '종로3가' | '이태원') => {
    setStatus('LOADING');
    try {
      const jongnoScenarios = [
        { story: '종로 3가 포장마차 거리. 왁자지껄한 술번개 테이블에 합류했습니다. 20대부터 50대까지, 다양한 정체성의 남자들이 소주잔을 기울이며 당신을 반깁니다.', history: ['종로 술번개 합류'] },
        { story: '종로의 한 가라오케. 화려한 미러볼 아래, 드랙퀸 언니가 마이크를 잡고 열창 중입니다. 당신은 탬버린을 흔들며 분위기에 취해갑니다.', history: ['종로 가라오케 진입'] },
        { story: '종로 3가 뒷골목의 소규모 클럽. 땀 냄새와 강렬한 비트가 섞인 이곳에서, 당신은 모르는 이들과 몸을 맞대고 춤을 춥니다.', history: ['종로 소규모 클럽'] },
        { story: '종로의 오래된 찻집. 조용한 분위기 속에서 중년의 신사가 당신에게 차 한 잔을 권하며 의미심장한 미소를 짓습니다.', history: ['종로 찻집 만남'] }
      ];

      const itaewonScenarios = [
        { story: '이태원의 대형 클럽 앞. 화려한 조명과 쿵쾅거리는 베이스가 심장을 때립니다. 당신은 오늘 밤의 주인공이 되기 위해 문을 엽니다.', history: ['이태원 클럽 진입'] },
        { story: '이태원 퀴어 바의 테라스. 칵테일 한 잔을 들고 지나가는 사람들을 구경하던 중, 스타일리시한 외국인이 말을 걸어옵니다.', history: ['이태원 테라스'] },
        { story: '이태원의 어두운 골목길. 낯선 남자의 시선이 당신의 등 뒤를 쫓습니다. 긴장감과 묘한 흥분이 온몸을 감쌉니다.', history: ['이태원 골목'] }
      ];

      const scenarioPool = location === '종로3가' ? jongnoScenarios : itaewonScenarios;
      const scenario = scenarioPool[Math.floor(Math.random() * scenarioPool.length)];

      const initialState: GameState = {
        stage: 1,
        abyssGauge: 50,
        story: scenario.story,
        choices: [],
        history: scenario.history
      };
      
      const next = await generateNextStage(initialState);
      setGameState({
        ...initialState,
        story: next.story,
        choices: next.choices
      });
      setStatus('PLAYING');
    } catch (err) {
      setError('나락으로 가는 길이 막혔습니다. 다시 시도하세요.');
      setStatus('START');
    }
  };

  const handleChoice = async (choice: GameChoice) => {
    const newGauge = Math.min(100, Math.max(0, gameState.abyssGauge + choice.impact));
    
    if (newGauge <= 30) {
      setGameState(prev => ({ ...prev, abyssGauge: newGauge }));
      setStatus('GAMEOVER');
      return;
    }

    if (gameState.stage >= 10) {
      setGameState(prev => ({ ...prev, abyssGauge: newGauge }));
      setStatus('VICTORY');
      return;
    }

    setStatus('LOADING');
    try {
      const nextState: GameState = {
        ...gameState,
        stage: gameState.stage + 1,
        abyssGauge: newGauge,
        history: [...gameState.history, choice.text]
      };
      
      const next = await generateNextStage(nextState);
      setGameState({
        ...nextState,
        story: next.story,
        choices: next.choices
      });
      setStatus('PLAYING');
    } catch (err) {
      setError('도파민 수혈 실패. 재접속이 필요합니다.');
      setStatus('PLAYING'); // Revert to current state if possible
    }
  };

  const resetGame = () => {
    setGameState({
      stage: 0,
      abyssGauge: 50,
      story: '',
      choices: [],
      history: []
    });
    setStatus('START');
    setError(null);
  };

  return (
    <motion.div 
      key={gameState.stage}
      initial={false}
      animate={(gameState.abyssGauge > 90 || gameState.abyssGauge < 40) && status === 'PLAYING' ? {
        x: [0, -5, 5, -5, 5, 0],
        y: [0, 5, -5, 5, -5, 0],
        rotate: [0, -1, 1, -1, 1, 0]
      } : {}}
      transition={{ duration: 1.2, ease: "easeInOut" }}
      className={cn(
        "min-h-screen bg-abyss-black selection:bg-dopamine-pink selection:text-white p-4 md:p-8 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300"
      )}
    >
      <div className="scanline" />
      
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--color-dopamine-pink)_0%,_transparent_70%)]" />
      </div>

      <AnimatePresence mode="wait">
        {status === 'AUTH' && (
          <motion.div 
            key="auth"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center z-10 max-w-md w-full"
          >
            <div className="brutal-border bg-white p-8 text-black">
              <Skull className="w-16 h-16 mx-auto mb-4 text-dopamine-pink" />
              <h2 className="font-display text-4xl uppercase mb-6 italic">ACCESS RESTRICTED</h2>
              <form onSubmit={handleAuth} className="flex flex-col gap-4">
                <input 
                  type="password" 
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="ENTER PASSCODE"
                  className={cn(
                    "brutal-border p-4 font-mono text-center text-xl outline-none transition-all",
                    authError ? "border-red-600 bg-red-50" : "border-black focus:bg-shock-yellow/10"
                  )}
                  autoFocus
                />
                <button 
                  type="submit"
                  className="brutal-btn bg-black text-white hover:bg-dopamine-pink border-black"
                >
                  INITIALIZE SESSION
                </button>
              </form>
              {authError && (
                <p className="mt-4 text-red-600 font-mono text-sm animate-pulse">
                  [ERROR: INVALID PASSCODE. ACCESS DENIED.]
                </p>
              )}
            </div>
          </motion.div>
        )}

        {status === 'START' && (
          <motion.div 
            key="start"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, x: -100 }}
            className="text-center z-10 max-w-2xl"
          >
            <h1 className="font-display text-6xl md:text-9xl uppercase leading-none mb-4 italic tracking-tighter text-dopamine-pink glitch-text">
              나락의 삶<br/>
              <span className="text-shock-yellow">~도파민걸~</span>
            </h1>
            <p className="font-mono text-lg md:text-xl mb-8 text-neon-green opacity-80">
              [SYSTEM: IDENTITY AWAKENED. 어떤 곳에서 나락에 빠지시겠습니까?]
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <button 
                onClick={() => startGame('종로3가')}
                className="brutal-btn text-white hover:text-shock-yellow border-white hover:border-shock-yellow min-w-[200px]"
              >
                종로 3가
              </button>
              <button 
                onClick={() => startGame('이태원')}
                className="brutal-btn text-white hover:text-dopamine-pink border-white hover:border-dopamine-pink min-w-[200px]"
              >
                이태원
              </button>
            </div>
            {error && <p className="mt-4 text-red-500 font-mono">{error}</p>}
          </motion.div>
        )}

        {status === 'LOADING' && (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center z-10"
          >
            <RefreshCw className="w-16 h-16 text-shock-yellow animate-spin mb-4" />
            <p className="font-display text-4xl uppercase text-shock-yellow animate-pulse">
              도파민 생성 중...
            </p>
          </motion.div>
        )}

        {status === 'PLAYING' && (
          <motion.div 
            key="playing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl z-10 grid grid-cols-1 md:grid-cols-12 gap-8"
          >
            {/* Left Rail: Stats */}
            <div className="md:col-span-3 flex flex-col gap-4">
              <div className="brutal-border p-4 bg-white text-black">
                <p className="font-mono text-xs uppercase font-bold mb-1">Stage</p>
                <p className="font-display text-5xl">{gameState.stage}<span className="text-xl">/10</span></p>
              </div>
              
              <div className={cn(
                "brutal-border p-4 transition-colors duration-500",
                gameState.abyssGauge > 70 ? "bg-neon-green text-black" : 
                gameState.abyssGauge > 40 ? "bg-shock-yellow text-black" : "bg-red-600 text-white"
              )}>
                <div className="flex justify-between items-center mb-2">
                  <p className="font-mono text-xs uppercase font-bold">Abyss Gauge</p>
                  <Skull className="w-4 h-4" />
                </div>
                <p className="font-display text-5xl">{gameState.abyssGauge}%</p>
                <div className="w-full h-4 bg-black/20 mt-2 border-2 border-black">
                  <motion.div 
                    className="h-full bg-current"
                    initial={{ width: 0 }}
                    animate={{ width: `${gameState.abyssGauge}%` }}
                  />
                </div>
                {gameState.abyssGauge <= 40 && (
                  <p className="text-[10px] mt-2 font-bold animate-pulse">WARNING: DOPAMINE DEFICIENCY</p>
                )}
              </div>

              <div className="hidden md:block brutal-border p-4 bg-dopamine-pink text-white">
                <p className="font-mono text-xs uppercase font-bold mb-2">History</p>
                <div className="flex flex-col gap-1">
                  {gameState.history.slice(-5).map((h, i) => (
                    <p key={i} className="text-[10px] truncate opacity-80">
                      {i === gameState.history.slice(-5).length - 1 ? '▶ ' : '• '}{h}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Story & Choices */}
            <div className="md:col-span-9 flex flex-col gap-6">
              <div className="brutal-border bg-white text-black p-6 md:p-10 relative">
                <div className="absolute -top-4 -left-4 bg-black text-white px-3 py-1 font-mono text-xs">
                  SCENE_{gameState.stage.toString().padStart(2, '0')}
                </div>
                <div className="prose prose-invert max-w-none font-sans text-xl leading-relaxed">
                  <ReactMarkdown>{gameState.story}</ReactMarkdown>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {gameState.choices.map((choice, idx) => (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.02, x: 10 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleChoice(choice)}
                    className="group relative text-left brutal-border bg-black hover:bg-white text-white hover:text-black p-4 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-display text-2xl opacity-30 group-hover:opacity-100">0{idx + 1}</span>
                      <span className="font-bold text-lg">{choice.text}</span>
                    </div>
                    <ChevronRight className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {status === 'GAMEOVER' && (
          <motion.div 
            key="gameover"
            initial={{ opacity: 0, scale: 1.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center z-10 max-w-2xl"
          >
            <AlertTriangle className="w-24 h-24 text-red-600 mx-auto mb-6 animate-bounce" />
            <h2 className="font-display text-8xl uppercase text-red-600 mb-4 glitch-text">
              나락 탈출 실패
            </h2>
            <p className="font-mono text-xl mb-8 text-white">
              [ERROR: DOPAMINE LEVEL CRITICAL. YOU BECAME NORMAL.]
              <br/>
              당신은 평범한 삶의 지루함에 질식해버렸습니다.
            </p>
            <button 
              onClick={resetGame}
              className="brutal-btn text-white border-white hover:bg-white hover:text-black"
            >
              다시 타락하기
            </button>
          </motion.div>
        )}

        {status === 'VICTORY' && (
          <motion.div 
            key="victory"
            initial={{ opacity: 0, rotate: -10 }}
            animate={{ opacity: 1, rotate: 0 }}
            className="text-center z-10 max-w-2xl"
          >
            <Skull className="w-24 h-24 text-neon-green mx-auto mb-6" />
            <h2 className="font-display text-8xl uppercase text-neon-green mb-4 glitch-text">
              나락의 정점
            </h2>
            <p className="font-mono text-xl mb-8 text-white">
              [SUCCESS: MAXIMUM DOPAMINE ACHIEVED. YOU ARE THE LEGEND OF ABYSS.]
              <br/>
              당신은 이제 그 누구도 범접할 수 없는 도파민의 화신이 되었습니다.
            </p>
            <div className="brutal-border p-6 bg-white text-black mb-8">
              <p className="font-bold mb-2 uppercase font-mono">Final Abyss Score</p>
              <p className="font-display text-7xl">{gameState.abyssGauge}%</p>
            </div>
            <button 
              onClick={resetGame}
              className="brutal-btn text-neon-green border-neon-green hover:bg-neon-green hover:text-black"
            >
              새로운 나락 찾기
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <div className="fixed bottom-4 right-4 font-mono text-[10px] text-white/30 pointer-events-none">
        V.1.0.0_DOPAMINE_GIRL // POWERED_BY_GEMINI_AI
      </div>
    </motion.div>
  );
}
