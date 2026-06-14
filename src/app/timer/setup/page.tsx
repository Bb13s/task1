'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';

export default function SetupPage() {
  const [speakerTested, setSpeakerTested] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [micError, setMicError] = useState('');
  const [micDevices, setMicDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [useRecording, setUseRecording] = useState(true);
  const [showAgreement, setShowAgreement] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);

  // 扬声器测试
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

  // 麦克风测试
  const handleMicTest = useCallback(async () => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: selectedDevice ? { deviceId: { exact: selectedDevice } } : true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // 获取设备列表
      const devices = await navigator.mediaDevices.enumerateAudioInputs();
      setMicDevices(devices);
      if (!selectedDevice && devices.length > 0) {
        setSelectedDevice(devices[0].deviceId);
      }

      const ctx = audioCtxRef.current || new AudioContext();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      sourceRef.current = source;

      setMicActive(true);
      setMicError('');

      const buffer = new Uint8Array(analyser.frequencyBinCount);
      const update = () => {
        analyser.getByteFrequencyData(buffer);
        const avg = buffer.reduce((a, b) => a + b, 0) / buffer.length;
        setMicLevel(Math.min(100, Math.round((avg / 255) * 100)));
        rafRef.current = requestAnimationFrame(update);
      };
      update();
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setMicError('麦克风权限被拒绝，如需使用录音功能请在浏览器设置中开启权限');
      } else {
        setMicError('麦克风访问失败：' + err.message);
      }
    }
  }, [selectedDevice]);

  // 停止监听
  const stopMic = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    sourceRef.current?.disconnect();
    analyserRef.current = null;
    setMicActive(false);
    setMicLevel(0);
  }, []);

  // 页面离开时清理
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', stopMic);
  }

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
        <p className="text-gray-400 mb-10">在开始计时前，请确保扬声器和麦克风工作正常</p>

        {/* ① 扬声器测试 */}
        <section className="bg-white/5 rounded-xl p-6 mb-6 border border-gray-800">
          <h2 className="text-xl font-bold mb-1">① 测试扬声器</h2>
          <p className="text-gray-400 text-sm mb-4">请点击测试按钮，收听扬声器是否有声音</p>
          <button
            onClick={handleSpeakerTest}
            className="px-6 py-2.5 bg-[#9e1b32] text-white rounded-lg hover:bg-[#7a1527] transition-colors font-medium"
          >
            {speakerTested ? '🔊 再次测试' : '🔇 测试'}
          </button>
          {speakerTested && (
            <span className="ml-3 text-green-400 text-sm">✓ 扬声器正常</span>
          )}
        </section>

        {/* ② 麦克风测试 */}
        <section className="bg-white/5 rounded-xl p-6 mb-6 border border-gray-800">
          <h2 className="text-xl font-bold mb-1">② 测试麦克风</h2>
          <p className="text-gray-400 text-sm mb-4">
            开始检测后，请站在辩手位置以正常声音念出【欢迎来到辩论赛，我是正方一辩】，随后返回本页面停止录制
          </p>

          {/* 设备选择 */}
          {micDevices.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">输入设备</label>
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
              >
                {micDevices.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>{d.label || `麦克风 ${d.deviceId.slice(0, 8)}`}</option>
                ))}
              </select>
            </div>
          )}

          {/* 音量条 */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-400 mb-1">
              <span>输入音量</span>
              <span>{micLevel}%</span>
            </div>
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-100"
                style={{
                  width: `${micLevel}%`,
                  backgroundColor: micLevel > 60 ? '#9e1b32' : micLevel > 20 ? '#6d28d9' : '#4b5563',
                }}
              />
            </div>
          </div>

          {/* 按钮 */}
          <div className="flex gap-3">
            {!micActive ? (
              <button
                onClick={handleMicTest}
                className="px-6 py-2.5 bg-[#6d28d9] text-white rounded-lg hover:bg-[#5b21b6] transition-colors font-medium"
              >
                🎤 测试麦克风以启用录音功能
              </button>
            ) : (
              <button
                onClick={stopMic}
                className="px-6 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors font-medium"
              >
                ⏹ 停止测试
              </button>
            )}
          </div>

          {micError && (
            <p className="mt-3 text-red-400 text-sm">{micError}</p>
          )}
          {micActive && !micError && (
            <p className="mt-3 text-green-400 text-sm">✓ 麦克风正常工作，音量等级：{micLevel}%</p>
          )}
        </section>

        {/* ③ 录音说明 */}
        <section className="bg-white/5 rounded-xl p-6 mb-6 border border-gray-800">
          <h2 className="text-xl font-bold mb-1">③ 录音设置</h2>
          <div className="space-y-2 text-sm text-gray-400 mb-4">
            <p>• 录制内容默认公开，可通过二维码进入录制结果页隐藏内容</p>
            <p>• 当前为公益免费期，持续免费到 2025 年 3 月</p>
            <button
              onClick={() => setShowAgreement(!showAgreement)}
              className="text-[#6d28d9] hover:text-[#7c3aed] transition-colors"
            >
              {showAgreement ? '收起' : '展开'}协议说明
            </button>
            {showAgreement && (
              <p className="text-gray-500 border-l-2 border-gray-700 pl-3 mt-1">
                用户启用即同意协议，平台不拥有录音及转文字版权，但可免费使用录音及转文字内容
              </p>
            )}
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setUseRecording(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !useRecording ? 'bg-[#9e1b32] text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              不使用录音功能
            </button>
            <button
              onClick={() => setUseRecording(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                useRecording ? 'bg-[#6d28d9] text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              使用录音功能
            </button>
          </div>
        </section>

        {/* 下一步 */}
        <div className="flex justify-between">
          <Link href="/" className="px-6 py-2.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors">
            返回上一步
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
