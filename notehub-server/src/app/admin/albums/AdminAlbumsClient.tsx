'use client';

import { useState } from 'react';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';

interface Album {
  id: number;
  name: string;
  description: string | null;
  created_at: number;
}

export default function AdminAlbumsClient({ initialAlbums }: { initialAlbums: Album[] }) {
  const [albums, setAlbums] = useState<Album[]>(initialAlbums);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const res = await fetch('/api/admin/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, description: newDesc || null }),
      });
      if (res.ok) {
        const data = await res.json();
        setAlbums(prev => [...prev, data.album]);
        setNewName('');
        setNewDesc('');
        setShowAdd(false);
        setError('');
        window.location.reload();
      } else {
        const data = await res.json();
        setError(data.error || '创建失败');
      }
    } catch {
      setError('网络错误');
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) return;
    try {
      const res = await fetch(`/api/admin/albums/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, description: editDesc || null }),
      });
      if (res.ok) {
        setAlbums(prev => prev.map(a => a.id === id ? { ...a, name: editName, description: editDesc } : a));
        setEditingId(null);
        setError('');
        window.location.reload();
      } else {
        const data = await res.json();
        setError(data.error || '更新失败');
      }
    } catch {
      setError('网络错误');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`确定删除专辑"${name}"？关联资源的专辑将被清空。`)) return;
    try {
      const res = await fetch(`/api/admin/albums/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAlbums(prev => prev.filter(a => a.id !== id));
        setError('');
        window.location.reload();
      } else {
        const data = await res.json();
        setError(data.error || '删除失败');
      }
    } catch {
      setError('网络错误');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl text-gray-800">专辑管理</span>
            <span className="text-xs bg-[#9e1b32]/10 text-[#9e1b32] px-2 py-0.5 rounded">开发者</span>
          </div>
          <nav className="flex gap-4">
            <Link href="/workspace" className="text-gray-600 hover:text-gray-900 text-sm">工作区</Link>
            <Link href="/explore" className="text-gray-600 hover:text-gray-900 text-sm">广场</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
        )}

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">所有专辑（{albums.length}）</h2>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-4 py-2 bg-[#9e1b32] text-white rounded-lg hover:bg-[#7a1527] transition-colors text-sm"
          >
            + 新建专辑
          </button>
        </div>

        {showAdd && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex gap-3 flex-wrap">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="专辑名称"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9e1b32] focus:border-transparent outline-none"
              />
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="简介（可选）"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9e1b32] focus:border-transparent outline-none"
              />
              <button onClick={handleCreate} className="px-4 py-2 bg-[#9e1b32] text-white rounded-lg hover:bg-[#7a1527] text-sm">创建</button>
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 text-sm">取消</button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {albums.map(album => (
            <div key={album.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              {editingId === album.id ? (
                <div className="flex gap-3 flex-wrap">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9e1b32] focus:border-transparent outline-none"
                  />
                  <input
                    type="text"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    placeholder="简介（可选）"
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9e1b32] focus:border-transparent outline-none"
                  />
                  <button onClick={() => handleUpdate(album.id)} className="px-3 py-2 bg-[#9e1b32] text-white rounded-lg hover:bg-[#7a1527] text-sm">保存</button>
                  <button onClick={() => setEditingId(null)} className="px-3 py-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 text-sm">取消</button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-800">{album.name}</h3>
                    {album.description && <p className="text-sm text-gray-500 mt-0.5">{album.description}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingId(album.id);
                        setEditName(album.name);
                        setEditDesc(album.description || '');
                      }}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(album.id, album.name)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      删除
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {albums.length === 0 && (
            <div className="text-center py-16 text-gray-500">暂无专辑，点击"新建专辑"创建</div>
          )}
        </div>
      </main>
    </div>
  );
}
