'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Segment {
  id: number;
  name: string;
  duration: number;
  side: 'pro' | 'con' | 'neutral';
  warn5s: boolean;
  dualTimer?: boolean;
}

const STORAGE_KEY = 'timer-config';

const TEMPLATES: Record<string, { name: string; segments: Omit<Segment, 'id'>[] }> = {
  campus: {
    name: '校园赛规则',
    segments: [
      { name: '开场', duration: 60, side: 'neutral', warn5s: true },
      { name: '正方一辩立论', duration: 180, side: 'pro', warn5s: true },
      { name: '反方四辩质询', duration: 90, side: 'con', warn5s: true },
      { name: '反方一辩立论', duration: 180, side: 'con', warn5s: true },
      { name: '正方四辩质询', duration: 90, side: 'pro', warn5s: true },
      { name: '正方二辩申论', duration: 120, side: 'pro', warn5s: true },
      { name: '反方三辩质询', duration: 90, side: 'con', warn5s: true },
      { name: '反方二辩申论', duration: 120, side: 'con', warn5s: true },
      { name: '正方三辩质询', duration: 90, side: 'pro', warn5s: true },
      { name: '自由辩论', duration: 300, side: 'neutral', warn5s: true },
      { name: '反方结辩', duration: 180, side: 'con', warn5s: true },
      { name: '正方结辩', duration: 180, side: 'pro', warn5s: true },
    ],
  },
  silver: {
    name: '银卡赛规则',
    segments: [
      { name: '开场', duration: 60, side: 'neutral', warn5s: true },
      { name: '正方一辩立论', duration: 180, side: 'pro', warn5s: true },
      { name: '反方四辩质询', duration: 90, side: 'con', warn5s: true },
      { name: '反方一辩立论', duration: 180, side: 'con', warn5s: true },
      { name: '正方四辩质询', duration: 90, side: 'pro', warn5s: true },
      { name: '自由辩论', duration: 300, side: 'neutral', warn5s: true },
      { name: '反方结辩', duration: 210, side: 'con', warn5s: true },
      { name: '正方结辩', duration: 210, side: 'pro', warn5s: true },
    ],
  },
};

export default function ConfigPage() {
  const router = useRouter();
  const [matchName, setMatchName] = useState('');
  const [proName, setProName] = useState('正方');
  const [conName, setConName] = useState('反方');
  const [proTopic, setProTopic] = useState('');
  const [conTopic, setConTopic] = useState('');
  const [segments, setSegments] = useState<Segment[]>([]);
  const [autoNext, setAutoNext] = useState(false);
  const [nextId, setNextId] = useState(1);

  // 从 localStorage 恢复
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        setMatchName(data.matchName || '');
        setProName(data.proName || '正方');
        setConName(data.conName || '反方');
        setProTopic(data.proTopic || '');
        setConTopic(data.conTopic || '');
        setSegments(data.segments || []);
        setAutoNext(data.autoNext || false);
        setNextId(data.nextId || 1);
      }
    } catch {}
  }, []);

  // 保存到 localStorage
  const save = (data: any) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  // 应用模板
  const applyTemplate = (key: string) => {
    const tmpl = TEMPLATES[key];
    if (!tmpl) return;
    const newSegments = tmpl.segments.map((s, i) => ({ ...s, id: nextId + i }));
    const data = { matchName, proName, conName, proTopic, conTopic, segments: newSegments, autoNext, nextId: nextId + newSegments.length };
    setSegments(newSegments);
    setNextId(nextId + newSegments.length);
    save(data);
  };

  // 添加环节
  const addSegment = () => {
    const newSeg = { id: nextId, name: '', duration: 120, side: 'neutral' as const, warn5s: true };
    const newSegments = [...segments, newSeg];
    setSegments(newSegments);
    setNextId(nextId + 1);
    save({ matchName, proName, conName, proTopic, conTopic, segments: newSegments, autoNext, nextId: nextId + 1 });
  };

  // 删除环节
  const removeSegment = (id: number) => {
    const newSegments = segments.filter(s => s.id !== id);
    setSegments(newSegments);
    save({ matchName, proName, conName, proTopic, conTopic, segments: newSegments, autoNext, nextId });
  };

  // 更新环节
  const updateSegment = (id: number, field: keyof Segment, value: any) => {
    const newSegments = segments.map(s => s.id === id ? { ...s, [field]: value } : s);
    setSegments(newSegments);
    save({ matchName, proName, conName, proTopic, conTopic, segments: newSegments, autoNext, nextId });
  };

  // 上移/下移
  const moveSegment = (index: number, dir: -1 | 1) => {
    const newSegments = [...segments];
    const target = index + dir;
    if (target < 0 || target >= newSegments.length) return;
    [newSegments[index], newSegments[target]] = [newSegments[target], newSegments[index]];
    setSegments(newSegments);
    save({ matchName, proName, conName, proTopic, conTopic, segments: newSegments, autoNext, nextId });
  };

  // 提交
  const handleStart = () => {
    if (segments.length === 0) {
      alert('请至少添加一个比赛环节');
      return;
    }
    save({ matchName, proName, conName, proTopic, conTopic, segments, autoNext, nextId });
    router.push('/timer/run');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <Link href="/timer/setup" className="text-gray-400 hover:text-white text-sm">← 返回上一步</Link>
          <span className="text-gray-600">/</span>
          <span className="text-[#9e1b32] font-medium">赛前配置</span>
        </div>

        <h1 className="text-3xl font-bold mb-10">赛前配置</h1>

        {/* 对阵双方 */}
        <section className="bg-white/5 rounded-xl p-6 mb-6 border border-gray-800">
          <h2 className="text-xl font-bold mb-4">赛事信息</h2>

          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">赛事名称</label>
            <input
              value={matchName}
              onChange={e => { setMatchName(e.target.value); save({ matchName: e.target.value, proName, conName, proTopic, conTopic, segments, autoNext, nextId }); }}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              placeholder="如：银卡赛华科队内选拔赛"
            />
          </div>

          <h3 className="text-lg font-semibold mb-3">对阵双方与辩题</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">正方队伍名</label>
              <input
                value={proName}
                onChange={e => { setProName(e.target.value); save({ proName: e.target.value, conName, proTopic, conTopic, segments, autoNext, nextId }); }}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                placeholder="正方队伍名"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">反方队伍名</label>
              <input
                value={conName}
                onChange={e => { setConName(e.target.value); save({ proName, conName: e.target.value, proTopic, conTopic, segments, autoNext, nextId }); }}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                placeholder="反方队伍名"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">正方辩题</label>
              <input
                value={proTopic}
                onChange={e => { setProTopic(e.target.value); save({ proName, conName, proTopic: e.target.value, conTopic, segments, autoNext, nextId }); }}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                placeholder="正方辩题"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">反方辩题</label>
              <input
                value={conTopic}
                onChange={e => { setConTopic(e.target.value); save({ proName, conName, proTopic, conTopic: e.target.value, segments, autoNext, nextId }); }}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                placeholder="反方辩题"
              />
            </div>
          </div>
        </section>

        {/* 赛程配置 */}
        <section className="bg-white/5 rounded-xl p-6 mb-6 border border-gray-800">
          <h2 className="text-xl font-bold mb-4">赛程配置</h2>

          {/* 模板 */}
          <div className="flex gap-3 mb-6">
            <button onClick={() => applyTemplate('campus')} className="px-4 py-2 bg-[#6d28d9]/20 text-[#6d28d9] border border-[#6d28d9]/30 rounded-lg text-sm hover:bg-[#6d28d9]/30 transition-colors">
              套用「校园赛规则」
            </button>
            <button onClick={() => applyTemplate('silver')} className="px-4 py-2 bg-[#6d28d9]/20 text-[#6d28d9] border border-[#6d28d9]/30 rounded-lg text-sm hover:bg-[#6d28d9]/30 transition-colors">
              套用「银卡赛规则」
            </button>
          </div>

          {/* 环节列表 */}
          <div className="space-y-3 mb-4">
            {segments.map((seg, index) => (
              <div key={seg.id} className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3">
                <div className="flex flex-col gap-1">
                  <button onClick={() => moveSegment(index, -1)} className="text-gray-500 hover:text-white text-xs disabled:opacity-30" disabled={index === 0}>▲</button>
                  <button onClick={() => moveSegment(index, 1)} className="text-gray-500 hover:text-white text-xs disabled:opacity-30" disabled={index === segments.length - 1}>▼</button>
                </div>
                <input
                  value={seg.name}
                  onChange={e => updateSegment(seg.id, 'name', e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  placeholder="环节名称"
                />
                <input
                  type="number"
                  value={seg.duration}
                  onChange={e => updateSegment(seg.id, 'duration', parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm text-center"
                />
                <span className="text-gray-400 text-xs w-6">秒</span>
                <select
                  value={seg.side}
                  onChange={e => updateSegment(seg.id, 'side', e.target.value)}
                  className="px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                >
                  <option value="pro">正方</option>
                  <option value="con">反方</option>
                  <option value="neutral">中立</option>
                </select>
                <label className="flex items-center gap-1 text-xs text-gray-400 whitespace-nowrap">
                  <input type="checkbox" checked={seg.warn5s} onChange={e => updateSegment(seg.id, 'warn5s', e.target.checked)} />
                  5秒
                </label>
                <label className="flex items-center gap-1 text-xs text-[#6d28d9] whitespace-nowrap">
                  <input type="checkbox" checked={seg.dualTimer || false} onChange={e => updateSegment(seg.id, 'dualTimer', e.target.checked)} />
                  双方计时
                </label>
                <button onClick={() => removeSegment(seg.id)} className="text-red-400 hover:text-red-300 text-lg">✕</button>
              </div>
            ))}
            {segments.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">暂无环节，请添加或套用模板</p>
            )}
          </div>

          <button onClick={addSegment} className="px-4 py-2 border border-dashed border-gray-600 rounded-lg text-gray-400 text-sm hover:border-gray-500 hover:text-white transition-colors">
            + 添加环节
          </button>
        </section>

        {/* 自动切换选项 */}
        <section className="bg-white/5 rounded-xl p-6 mb-6 border border-gray-800">
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={autoNext} onChange={e => { setAutoNext(e.target.checked); save({ matchName, proName, conName, proTopic, conTopic, segments, autoNext: e.target.checked, nextId }); }} />
            <span className="text-sm">当前环节结束后自动进入下一环节</span>
          </label>
        </section>

        {/* 提交 */}
        <button
          onClick={handleStart}
          className="w-full py-3 bg-[#9e1b32] text-white rounded-xl hover:bg-[#7a1527] transition-colors font-medium text-lg"
        >
          使用以上配置开始计时
        </button>
      </div>
    </div>
  );
}
