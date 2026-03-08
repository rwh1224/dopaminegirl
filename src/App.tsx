/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Skull, RefreshCw, ChevronRight, AlertTriangle } from 'lucide-react';
// ✅ 경로 수정: geminiService에서 openaiService로 변경
import { generateNextStage, GameState, GameChoice } from './services/openaiService';
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
      const scenarioPool = {
        '종로3가': [
          { story: '종로 3가 포장마차 거리. 소주잔을 기울이며 당신을 반기는 남자들 사이로 합류합니다.', history: ['종로 술번개 합류'] },
          { story: '종로의 한 가라오케. 드랙퀸 언니의 열창 속에 당신은 분위기에 취해갑니다.', history: ['종로 가라오케 진입'] }
        ],
        '이태원': [
          { story: '이태원의 대형 클럽 앞. 화려한 조명과 베이스가 심장을 때립니다.', history: ['이태원 클럽 진입'] },
          { story: '이태원 퀴어 바의 테라스. 스타일리시한 외국인이 말을 걸어옵니다.', history: ['이태원 테라스'] }
        ]
      };

      const locationScenarios = scenarioPool[location];
      const scenario = locationScenarios[Math.floor(Math.random() * locationScenarios.length)];

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
      setError('도파민 수혈 실패.');
      setStatus('PLAYING');
    }
  };

  const resetGame = () => {
    setGameState({ stage: 0, abyssGauge: 50, story: '', choices: [], history: [] });
    setStatus('START');
    setError(null);
  };

  return (
    <motion.div 
      className="min-h-screen bg-black text-white p-4 md:p-8 flex flex-col items-center justify-center relative overflow-hidden"
    >
      <div className="scanline" />
      
      <AnimatePresence mode="wait">
        {status === 'AUTH' && (
          <motion.div key="auth" className="text-center z-10 max-w-md w-full">
            <div className="brutal-border bg-white p-8 text-black">
              <Skull className="w-16 h-16 mx-auto mb-4 text-pink-500" />
              <h2 className="text-4xl font-bold mb-6 italic">ACCESS RESTRICTED</h2>
              <form onSubmit={handleAuth} className="flex flex-col gap-4">
                <input 
                  type="password" 
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="PASSCODE"
                  className={cn("brutal-border p-4 text-center text-xl outline-none", authError && "bg-red-50")}
                />
                <button type="submit" className="brutal-btn bg-black text-white hover:bg-pink-500">INIT SESSION</button>
              </form>
            </div>
          </motion.div>
        )}

        {status === 'START' && (
          <motion.div key="start" className="text-center z-10">
            <h1 className="text-6xl md:text-9xl font-black italic text-pink-500 mb-8 glitch-text">
              나락의 삶<br/><span className="text-yellow-400">~도파민걸~</span>
            </h1>
            <div className="flex gap-4 justify-center">
              <button onClick={() => startGame('종로3가')} className="brutal-btn border-white hover:border-yellow-400">종로 3가</button>
              <button onClick={() => startGame('이태원')} className="brutal-btn border-white hover:border-pink-500">이태원</button>
            </div>
          </motion.div>
        )}

        {status === 'LOADING' && (
          <motion.div key="loading" className="flex flex-col items-center z-10">
            <RefreshCw className="w-16 h-16 text-yellow-400 animate-spin mb-4" />
            <p className="text-4xl text-yellow-400 animate-pulse">도파민 생성 중...</p>
          </motion.div>
        )}

        {status === 'PLAYING' && (
          <motion.div key="playing" className="w-full max-w-4xl z-10 grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-3 flex flex-col gap-4">
              <div className="brutal-border p-4 bg-white text-black text-center">
                <p className="text-xs font-bold uppercase">Stage</p>
                <p className="text-5xl font-bold">{gameState.stage}/10</p>
              </div>
              <div className={cn("brutal-border p-4", gameState.abyssGauge > 40 ? "bg-yellow-400 text-black" : "bg-red-600 text-white")}>
                <p className="text-xs font-bold uppercase">Abyss</p>
                <p className="text-5xl font-bold">{gameState.abyssGauge}%</p>
              </div>
            </div>

            <div className="md:col-span-9 flex flex-col gap-6">
              <div className="brutal-border bg-white text-black p-8 relative">
                <div className="prose text-xl leading-relaxed">
                  <ReactMarkdown>{gameState.story}</ReactMarkdown>
                </div>
              </div>
              <div className="grid gap-4">
                {gameState.choices.map((choice, idx) => (
                  <button key={idx} onClick={() => handleChoice(choice)} className="brutal-btn bg-black text-white hover:bg-white hover:text-black text-left flex justify-between items-center p-4 transition-all">
                    <span>{choice.text}</span>
                    <ChevronRight />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {status === 'GAMEOVER' && (
          <motion.div key="gameover" className="text-center z-10">
            <AlertTriangle className="w-24 h-24 text-red-600 mx-auto mb-6" />
            <h2 className="text-8xl font-black text-red-600 mb-4">나락 탈출 실패</h2>
            <button onClick={resetGame} className="brutal-btn border-white hover:bg-white hover:text-black">다시 타락하기</button>
          </motion.div>
        )}

        {status === 'VICTORY' && (
          <motion.div key="victory" className="text-center z-10">
            <Skull className="w-24 h-24 text-green-400 mx-auto mb-6" />
            <h2 className="text-8xl font-black text-green-400 mb-4">나락의 정점</h2>
            <button onClick={resetGame} className="brutal-btn border-green-400 hover:bg-green-400 hover:text-black">새로운 나락 찾기</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-4 right-4 text-xs text-white/30 uppercase">
        V.1.1.0_DOPAMINE_GIRL // POWERED_BY_OPENAI
      </div>
    </motion.div>
  );
}
