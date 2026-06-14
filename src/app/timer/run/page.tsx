'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Segment {
  id: number;
  name: string;
  duration: number;
  side: 'pro' | 'con' | 'neutral';
  warn5s: boolean;
}

interface Config {
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
      setTimeLeft(data.segments[0].duration);
    } catch { router.replace('/timer/setup'); }
  }, []);

  // 播放提示音
  const playBeep = useCallback((freq: number, duration: number, times = 1) => {
    try {
      const ctx = audioCtxRef.current || new AudioContext();
      audioCtxRef.current = ctx;
      for (let t = 0; t < times; t++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.value = 0.3;
        osc.connect(gain);
        gain.connect(ctx.destination);
        const start = ctx.currentTime + t * (duration + 0.1);
        osc.start(start);
        gain.gain.setValueAtTime(0.3, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        osc.stop(start + duration);
      }
    } catch {}
  }, []);

  // 5秒提醒音
  const playWarn5s = useCallback(() => playBeep(880, 0.15, 1), [playBeep]);

  // 时间到提醒音
  const playTimeUp = useCallback(() => playBeep(660, 0.3, 3), [playBeep]);

  // 奇袭音
  const playSurprise = useCallback(() => playBeep(440, 0.1, 5), [playBeep]);

  // 30秒试音
  const playTestSound = useCallback(() => {
    const ctx = audioCtxRef.current || new AudioContext();
    audioCtxRef.current = ctx;
    for (let i = 0; i < 30; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 440 + Math.random() * 200;
      gain.gain.value = 0.2;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const start = ctx.currentTime + i * 0.5;
      osc.start(start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
      osc.stop(start + 0.3);
    }
  }, []);

  // 倒计时
  useEffect(() => {
    if (timerState !== 'running') return;
    intervalRef.current = window.setInterval(() => {
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
        // 5秒提醒
        if (prev === 6 && config?.segments[currentIdx]?.warn5s) {
          playWarn5s();
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [timerState, config, currentIdx, playWarn5s, playTimeUp]);

  // 当前环节
  const current = config?.segments[currentIdx];
  const total = current?.duration || 0;
  const progress = total > 0 ? (timeLeft / total) * 100 : 0;

  // 启动/暂停
  const toggleTimer = () => {
    if (timerState === 'running') setTimerState('paused');
    else if (timerState === 'paused' || timerState === 'idle') setTimerState('running');
  };

  // 重置
  const resetTimer = () => {
    setTimerState('idle');
    setTimeLeft(current?.duration || 0);
  };

  // 上一个环节
  const prevSegment = () => {
    if (currentIdx <= 0) return;
    const idx = currentIdx - 1;
    setCurrentIdx(idx);
    setTimeLeft(config!.segments[idx].duration);
    setTimerState('idle');
  };

  // 下一个环节
  const nextSegment = () => {
    if (!config) return;
    if (currentIdx >= config.segments.length - 1) {
      alert('已到最后一个环节');
      return;
    }
    const idx = currentIdx + 1;
    setCurrentIdx(idx);
    setTimeLeft(config.segments[idx].duration);
    setTimerState('idle');
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
        case 'q': case 'Q': playTestSound(); break;
        case 'w': case 'W': playWarn5s(); break;
        case 'e': case 'E': playTimeUp(); break;
        case 'f': case 'F': toggleFullscreen(); break;
        case 'b': case 'B': router.push('/timer/config'); break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [timerState, currentIdx, config]);

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
        <div className={`w-1/2 flex items-center justify-center ${surpriseActive ? 'bg-purple-700' : 'bg-[#9e1b32]'} ${timeLeft === 0 ? 'animate-pulse' : ''} transition-colors`}>
          <span className="text-white font-bold text-3xl md:text-5xl border-2 border-white px-6 py-1">{config.proName}</span>
        </div>
        <div className={`w-1/2 flex items-center justify-center ${surpriseActive ? 'bg-purple-700' : 'bg-[#6d28d9]'} ${timeLeft === 0 ? 'animate-pulse' : ''} transition-colors`}>
          <span className="text-white font-bold text-3xl md:text-5xl border-2 border-white px-6 py-1">{config.conName}</span>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {/* 赛事标题 */}
        {(config.proTopic || config.conTopic) && (
          <p className="text-gray-500 text-sm md:text-base mb-4">
            {config.proTopic} {config.conTopic ? `vs ${config.conTopic}` : ''}
          </p>
        )}

        {/* 当前环节 */}
        <h2 className="text-gray-400 text-lg md:text-xl mb-6 font-light tracking-wider">
          {surpriseActive ? '⚡ 奇袭' : current.name}
        </h2>

        {/* 计时 */}
        <div className={`text-[12vw] md:text-[10vw] font-bold tabular-nums ${timeColor} ${blinkAnim} tracking-wider leading-none mb-4`}
          style={{ textShadow: '0 0 40px rgba(0,0,0,0.5)' }}
        >
          {formatTime(timeLeft)}
        </div>

        {/* 进度条 */}
        <div className="w-64 md:w-96 h-1 bg-gray-800 rounded-full overflow-hidden mt-4">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${progress}%`,
              backgroundColor: timeLeft === 0 ? '#ef4444' : timeLeft <= 5 ? '#eab308' : surpriseActive ? '#7c3aed' : '#9e1b32',
            }}
          />
        </div>
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
            <button onClick={playTestSound} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-200">🔊 试音 (Q)</button>
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
