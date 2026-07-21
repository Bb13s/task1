'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';

export default function SetupPage() {
  const [speakerTested, setSpeakerTested] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const handleSpeakerTest = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 440;
      gain.gain.value = 0.5;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
      osc.stop(ctx.currentTime + 1);
      setSpeakerTested(true);
    } catch {
      alert('当前环境不支持音频播放，请检查浏览器权限/版本');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <Link href="/" className="text-gray-400 hover:text-white text-sm">← 返回首页</Link>
          <span className="text-gray-600">/</span>
          <span className="text-[#9e1b32] font-medium">辩论计时器</span>
        </div>

        <h1 className="text-3xl font-bold mb-2">设备测试</h1>
        <p className="text-gray-400 mb-10">在开始计时前，请确认扬声器正常工作</p>

        {/* 扬声器测试 */}
        <section className="bg-white/5 rounded-xl p-6 mb-10 border border-gray-800">
          <h2 className="text-xl font-bold mb-1">测试扬声器</h2>
          <p className="text-gray-400 text-sm mb-4">点击下方按钮，收听是否有提示音</p>
          <button
            onClick={handleSpeakerTest}
            className="px-6 py-2.5 bg-[#9e1b32] text-white rounded-lg hover:bg-[#7a1527] transition-colors font-medium"
          >
            {speakerTested ? '🔊 再次测试' : '🔇 测试扬声器'}
          </button>
          {speakerTested && (
            <span className="ml-3 text-green-400 text-sm">✓ 扬声器正常</span>
          )}
        </section>

        {/* 跳转 */}
        <div className="flex justify-between">
          <Link href="/" className="px-6 py-2.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors">
            返回首页
          </Link>
          <Link
            href="/timer/config"
            className="px-8 py-2.5 bg-[#9e1b32] text-white rounded-lg hover:bg-[#7a1527] transition-colors font-medium text-lg"
          >
            下一步 →
          </Link>
        </div>
      </div>
    </div>
  );
}
