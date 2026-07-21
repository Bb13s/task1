'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Segment {
  id: number;
  name: string;
  duration: number;
  side: 'pro' | 'con' | 'neutral';
  warn5s: boolean;
  dualTimer?: boolean;
}

interface Config {
  matchName?: string;
  proName: string;
  conName: string;
  proTopic: string;
  conTopic: string;
  segments: Segment[];
  autoNext: boolean;
}

type TimerState = 'idle' | 'running' | 'paused';

export default function RunPage() {
  const router = useRouter();
  const [config, setConfig] = useState<Config | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [surpriseActive, setSurpriseActive] = useState(false);
  const [dualTimer, setDualTimer] = useState(false);
  const [proTimeLeft, setProTimeLeft] = useState(0);
  const [conTimeLeft, setConTimeLeft] = useState(0);
  const [activeSide, setActiveSide] = useState<'pro' | 'con'>('pro');
  const intervalRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // 加载配置
  useEffect(() => {
    try {
      const saved = localStorage.getItem('timer-config');
      if (!saved) { router.replace('/timer/setup'); return; }
      const data = JSON.parse(saved);
      if (!data.segments || data.segments.length === 0) { router.replace('/timer/config'); return; }
      setConfig(data);
      const first = data.segments[0];
      setTimeLeft(first.duration);
      if (first.dualTimer) {
        setDualTimer(true);
        setProTimeLeft(first.duration);
        setConTimeLeft(first.duration);
      }
    } catch { router.replace('/timer/setup'); }
  }, []);

  // 播放单次提示音
  const playBeep = useCallback((freq: number, duration: number, startDelay = 0) => {
    try {
      const ctx = audioCtxRef.current || new AudioContext();
      audioCtxRef.current = ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.value = 0.3;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const start = ctx.currentTime + startDelay;
      osc.start(start);
      gain.gain.setValueAtTime(0.3, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc.stop(start + duration);
    } catch {}
  }, []);

  // 30 秒提醒：嘟（低频短音）
  const playWarn30s = useCallback(() => {
    playBeep(500, 0.25, 0);
    playBeep(500, 0.25, 0.4);
    playBeep(500, 0.25, 0.8);
  }, [playBeep]);

  // 5 秒提醒：嘀嘀嘀（三声高音）
  const playWarn5s = useCallback(() => {
    playBeep(880, 0.12, 0);
    playBeep(880, 0.12, 0.2);
    playBeep(880, 0.12, 0.4);
  }, [playBeep]);

  // 结束音：哔哔哔哔，哔哔哔哔（两组四声）
  const playTimeUp = useCallback(() => {
    for (let group = 0; group < 2; group++) {
      for (let i = 0; i < 4; i++) {
        playBeep(660, 0.15, group * 2.5 + i * 0.25);
      }
    }
  }, [playBeep]);

  // 奇袭音
  const playSurprise = useCallback(() => {
    for (let i = 0; i < 5; i++) {
      playBeep(440, 0.1, i * 0.15);
    }
  }, [playBeep]);

  // 当前环节
  const current = config?.segments[currentIdx];

  // 倒计时
  useEffect(() => {
    if (timerState !== 'running') return;
    intervalRef.current = window.setInterval(() => {
      if (dualTimer) {
        // 双方计时：只更新当前发言方的计时
        if (activeSide === 'pro') {
          setProTimeLeft(prev => {
            if (prev <= 1) { playTimeUp(); return 0; }
            if (prev === 31) playWarn30s();
            if (prev === 6 && current?.warn5s) playWarn5s();
            return prev - 1;
          });
        } else {
          setConTimeLeft(prev => {
            if (prev <= 1) { playTimeUp(); return 0; }
            if (prev === 31) playWarn30s();
            if (prev === 6 && current?.warn5s) playWarn5s();
            return prev - 1;
          });
        }
      } else {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setTimerState('idle');
            playTimeUp();
            if (config?.autoNext && currentIdx < (config.segments.length - 1)) {
              setTimeout(() => {
                setCurrentIdx(prev => prev + 1);
                setTimeLeft(config!.segments[currentIdx + 1].duration);
              }, 500);
            }
            return 0;
          }
          if (prev === 31) playWarn30s();
          if (prev === 6 && config?.segments[currentIdx]?.warn5s) playWarn5s();
          return prev - 1;
        });
      }
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [timerState, config, currentIdx, dualTimer, activeSide, playWarn30s, playWarn5s, playTimeUp]);

  const total = current?.duration || 0;
  const progress = total > 0 ? (timeLeft / total) * 100 : 0;

  // 启动/暂停
  const toggleTimer = () => {
    if (timerState === 'running') setTimerState('paused');
    else if (timerState === 'paused' || timerState === 'idle') {
      if (dualTimer && timerState === 'idle') {
        // 初次启动双计时，默认正方先发言
        setActiveSide('pro');
      }
      setTimerState('running');
    }
  };

  // 切换发言方（双方计时模式下）
  const switchSide = () => {
    if (!dualTimer) return;
    setActiveSide(prev => prev === 'pro' ? 'con' : 'pro');
  };

  // 重置
  const resetTimer = () => {
    setTimerState('idle');
    if (dualTimer) {
      setProTimeLeft(current?.duration || 0);
      setConTimeLeft(current?.duration || 0);
    } else {
      setTimeLeft(current?.duration || 0);
    }
  };

  // 切换环节时初始化
  const switchSegment = (idx: number) => {
    setCurrentIdx(idx);
    const seg = config!.segments[idx];
    if (seg.dualTimer) {
      setDualTimer(true);
      setProTimeLeft(seg.duration);
      setConTimeLeft(seg.duration);
    } else {
      setDualTimer(false);
      setTimeLeft(seg.duration);
    }
    setTimerState('idle');
  };

  // 上一个环节
  const prevSegment = () => {
    if (currentIdx <= 0) return;
    switchSegment(currentIdx - 1);
  };

  // 下一个环节
  const nextSegment = () => {
    if (!config) return;
    if (currentIdx >= config.segments.length - 1) {
      alert('已到最后一个环节');
      return;
    }
    switchSegment(currentIdx + 1);
  };

  // 奇袭
  const handleSurprise = () => {
    setSurpriseActive(true);
    setTimeLeft(30);
    setTimerState('running');
    playSurprise();
    setTimeout(() => {
      setSurpriseActive(false);
      setTimeLeft(current?.duration || 0);
      setTimerState('idle');
    }, 30000);
  };

  // 全屏
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // 快捷键
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      switch (e.key) {
        case ' ': e.preventDefault(); toggleTimer(); break;
        case 'ArrowLeft': e.preventDefault(); prevSegment(); break;
        case 'ArrowRight': e.preventDefault(); nextSegment(); break;
        case 'p': case 'P': setTimerState('paused'); break;
        case 'r': case 'R': resetTimer(); break;
        case 'Tab': e.preventDefault(); if (dualTimer) switchSide(); break;
        case 'q': case 'Q': playWarn30s(); break;
        case 'w': case 'W': playWarn5s(); break;
        case 'e': case 'E': playTimeUp(); break;
        case 'f': case 'F': toggleFullscreen(); break;
        case 'b': case 'B': router.push('/timer/config'); break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [timerState, currentIdx, config, dualTimer, activeSide, playWarn30s, playWarn5s, playTimeUp]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (!config || !current) return null;

  // 时间状态样式
  const timeColor = timeLeft === 0 ? 'text-red-500' : timeLeft <= 5 ? 'text-yellow-400' : 'text-white';
  const blinkAnim = timeLeft === 0 ? 'animate-pulse' : '';

  return (
    <div className="h-screen bg-gradient-to-b from-[#0a0a0a] to-[#1a1a1a] flex flex-col overflow-hidden select-none">
      {/* 顶部条带 */}
      <div className="flex h-[10vh] shrink-0">
        <div className={`w-1/2 flex items-center pl-6 ${surpriseActive ? 'bg-purple-700' : 'bg-[#9e1b32]'} ${timeLeft === 0 ? 'animate-pulse' : ''} transition-colors`}>
          <span className="text-white/30 font-bold text-5xl md:text-7xl select-none leading-none">正方</span>
          {config.proName && config.proName !== '正方' && (
            <span className="text-white font-bold text-2xl md:text-4xl ml-4">{config.proName}</span>
          )}
        </div>
        <div className={`w-1/2 flex items-center justify-end pr-6 ${surpriseActive ? 'bg-purple-700' : 'bg-[#6d28d9]'} ${timeLeft === 0 ? 'animate-pulse' : ''} transition-colors`}>
          {config.conName && config.conName !== '反方' && (
            <span className="text-white font-bold text-2xl md:text-4xl mr-4">{config.conName}</span>
          )}
          <span className="text-white/30 font-bold text-5xl md:text-7xl select-none leading-none">反方</span>
        </div>
      </div>

      {/* 辩题 */}
      {(config.proTopic || config.conTopic) && (
        <div className="flex shrink-0 px-6 py-3">
          <div className="w-1/2">
            {config.proTopic && (
              <span className="text-gray-400 font-medium text-xl md:text-2xl">{config.proTopic}</span>
            )}
          </div>
          <div className="w-1/2 text-right">
            {config.conTopic && (
              <span className="text-gray-400 font-medium text-xl md:text-2xl">{config.conTopic}</span>
            )}
          </div>
        </div>
      )}

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 -mt-48">
        {/* 赛事名称 */}
        {config.matchName && (
          <h1 className="text-4xl md:text-5xl font-bold -mt-16 mb-16 bg-gradient-to-r from-[#9e1b32] to-[#6d28d9] bg-clip-text text-transparent">
            {config.matchName}
          </h1>
        )}
        {/* 当前环节 */}
        <h2 className="text-gray-400 text-3xl md:text-4xl mb-6 font-light tracking-wider">
          {surpriseActive ? '⚡ 奇袭' : current.name}
        </h2>

        {/* 计时 - 双方计时模式 */}
        {dualTimer ? (
          <div className="flex items-center justify-center gap-8 md:gap-16 w-full px-4">
            <div
              className={`flex flex-col items-center cursor-pointer transition-all p-6 rounded-2xl ${activeSide === 'pro' ? 'bg-[#9e1b32]/10 ring-2 ring-[#9e1b32] scale-105' : 'opacity-50 hover:opacity-80'}`}
              onClick={() => { if (activeSide !== 'pro') setActiveSide('pro'); }}
            >
              <span className="text-[#9e1b32] text-lg font-bold mb-2">{config.proName}</span>
              <span className={`text-[8vw] md:text-[6vw] font-bold tabular-nums tracking-wider leading-none ${proTimeLeft === 0 ? 'text-red-500 animate-pulse' : proTimeLeft <= 5 ? 'text-yellow-400' : 'text-white'}`}>
                {formatTime(proTimeLeft)}
              </span>
            </div>
            <span className="text-gray-600 text-2xl font-bold">VS</span>
            <div
              className={`flex flex-col items-center cursor-pointer transition-all p-6 rounded-2xl ${activeSide === 'con' ? 'bg-[#6d28d9]/10 ring-2 ring-[#6d28d9] scale-105' : 'opacity-50 hover:opacity-80'}`}
              onClick={() => { if (activeSide !== 'con') setActiveSide('con'); }}
            >
              <span className="text-[#6d28d9] text-lg font-bold mb-2">{config.conName}</span>
              <span className={`text-[8vw] md:text-[6vw] font-bold tabular-nums tracking-wider leading-none ${conTimeLeft === 0 ? 'text-red-500 animate-pulse' : conTimeLeft <= 5 ? 'text-yellow-400' : 'text-white'}`}>
                {formatTime(conTimeLeft)}
              </span>
            </div>
          </div>
        ) : (
          <>
            <div className={`text-[12vw] md:text-[10vw] font-bold tabular-nums ${timeColor} ${blinkAnim} tracking-wider leading-none mb-4`}
              style={{ textShadow: '0 0 40px rgba(0,0,0,0.5)' }}
            >
              {formatTime(timeLeft)}
            </div>
            <div className="w-64 md:w-96 h-1 bg-gray-800 rounded-full overflow-hidden mt-4">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${progress}%`,
                  backgroundColor: timeLeft === 0 ? '#ef4444' : timeLeft <= 5 ? '#eab308' : surpriseActive ? '#7c3aed' : '#9e1b32',
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* 控制栏 */}
      <div
        className="absolute bottom-0 left-0 right-0 transition-opacity duration-300"
        onMouseEnter={() => setShowPanel(true)}
        onMouseLeave={() => setShowPanel(false)}
        style={{ opacity: showPanel ? 1 : 0.15 }}
      >
        <div className="bg-black/80 backdrop-blur-sm border-t border-gray-800 px-4 py-3">
          <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-2">
            <button onClick={toggleTimer} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-200">
              {timerState === 'running' ? '⏸ 暂停 (空格)' : '▶ 启动 (空格)'}
            </button>
            <button onClick={resetTimer} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-200">↺ 重置 (R)</button>
            <button onClick={prevSegment} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-200">◀ 上一 (←)</button>
            <button onClick={nextSegment} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-200">下一 (→) ▶</button>
            <button onClick={handleSurprise} className="px-3 py-1.5 bg-purple-800 hover:bg-purple-700 rounded text-xs text-gray-200">⚡ 奇袭</button>
            {dualTimer && (
              <button onClick={switchSide} className="px-3 py-1.5 bg-[#6d28d9] hover:bg-[#5b21b6] rounded text-xs text-gray-200">
                ↔ 切换发言方 (Tab)
              </button>
            )}
            <button onClick={playWarn30s} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-200">🔔 30秒 (Q)</button>
            <button onClick={playWarn5s} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-200">⏰ 5秒 (W)</button>
            <button onClick={playTimeUp} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-200">🔔 结束 (E)</button>
            <button onClick={toggleFullscreen} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-200">⛶ 全屏 (F)</button>
            <button onClick={() => router.push('/timer/config')} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-200">← 返回 (B)</button>
          </div>
        </div>
      </div>
    </div>
  );
}
