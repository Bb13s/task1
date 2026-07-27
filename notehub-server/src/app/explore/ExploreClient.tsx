'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface SearchItem {
  type: 'note' | 'pdf';
  item_id: number;
  title: string;
  author: string;
  album_name: string | null;
  album_id: number | null;
  filename: string | null;
}

interface Album {
  id: number;
  name: string;
}

export default function ExploreClient() {
  const [items, setItems] = useState<SearchItem[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [albumId, setAlbumId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 12;

  const fetchAlbums = async () => {
    try {
      const res = await fetch('/api/albums');
      const data = await res.json();
      setAlbums(data.albums || []);
    } catch {}
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      if (keyword.trim()) params.set('keyword', keyword.trim());
      if (albumId !== null) params.set('albumId', String(albumId));

      const res = await fetch(`/api/explore/search?${params}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlbums();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [keyword, albumId]);

  useEffect(() => {
    fetchData();
  }, [page, albumId]);

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#9e1b32] to-[#4A2887] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="font-bold text-xl text-gray-800">NoteHub</span>
          </div>
          <nav className="flex gap-4">
            <Link href="/" className="text-gray-600 hover:text-gray-900">首页</Link>
            <Link href="/explore" className="text-[#9e1b32] font-medium">广场</Link>
            <Link href="/workspace" className="text-gray-600 hover:text-gray-900">工作区</Link>
            <Link href="/admin/albums" className="text-gray-400 hover:text-gray-600 text-sm">管理</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">笔记广场</h1>
          <p className="text-gray-600">发现社区中分享的公开笔记和文件</p>
        </div>

        {/* 检索栏 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-8">
          <div className="flex gap-3 flex-wrap">
            <select
              value={albumId ?? ''}
              onChange={(e) => setAlbumId(e.target.value === '' ? null : parseInt(e.target.value))}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9e1b32] focus:border-transparent outline-none"
            >
              <option value="">全部专辑</option>
              {albums.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="搜索标题、专辑、作者..."
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9e1b32] focus:border-transparent outline-none min-w-[200px]"
            />
            <button
              onClick={handleSearch}
              className="px-5 py-2 bg-[#9e1b32] text-white rounded-lg hover:bg-[#7a1527] transition-colors text-sm font-medium"
            >
              搜索
            </button>
          </div>
        </div>

        {/* 搜索结果 */}
        {loading ? (
          <div className="text-center py-16 text-gray-500">加载中...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <p className="text-gray-500">暂无公开内容</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                item.type === 'note' ? (
                  <Link
                    key={`note-${item.item_id}`}
                    href={`/notes/${item.item_id}`}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow block"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-lg text-gray-800 line-clamp-2 flex-1">
                        {item.title}
                      </h3>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full ml-2 shrink-0">
                        笔记
                      </span>
                    </div>
                    <div className="space-y-1.5 text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">作者:</span>
                        <span className="font-medium text-gray-700">{item.author}</span>
                      </div>
                      {item.album_name && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">专辑:</span>
                          <span className="text-[#9e1b32] text-xs bg-[#9e1b32]/5 px-2 py-0.5 rounded">{item.album_name}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                ) : (
                  <a
                    key={`pdf-${item.item_id}`}
                    href={`/api/files?filename=${item.filename}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow block"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-lg text-gray-800 line-clamp-2 flex-1">
                        {item.title}
                      </h3>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full ml-2 shrink-0">
                        PDF
                      </span>
                    </div>
                    <div className="space-y-1.5 text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">作者:</span>
                        <span className="font-medium text-gray-700">{item.author}</span>
                      </div>
                      {item.album_name && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">专辑:</span>
                          <span className="text-[#9e1b32] text-xs bg-[#9e1b32]/5 px-2 py-0.5 rounded">{item.album_name}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <span className="text-[#9e1b32] text-sm font-medium">点击查看 →</span>
                    </div>
                  </a>
                )
              ))}
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                <span className="text-sm text-gray-600">
                  第 {page} / {totalPages} 页（共 {total} 项）
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
