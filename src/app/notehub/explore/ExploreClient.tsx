'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Note {
  id: number;
  title: string;
  author: string;
  created_at: string;
  content?: string;
}

interface FileRecord {
  id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  uploaded_by: string;
  uploaded_at: string;
}

export default function ExploreClient() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      // 添加时间戳和缓存控制，确保获取最新数据
      const timestamp = Date.now();
      const [notesRes, filesRes] = await Promise.all([
        fetch(`/api/notes?public=true&_t=${timestamp}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        }),
        fetch(`/api/files?public=true&_t=${timestamp}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        })
      ]);

      const notesData = await notesRes.json();
      const filesData = await filesRes.json();

      setNotes(notesData.notes || []);
      setFiles(filesData.files || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#9e1b32] to-[#6d28d9] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="font-bold text-xl text-gray-800">NoteHub</span>
          </div>
          <nav className="flex gap-4">
            <Link href="/notehub" className="text-gray-600 hover:text-gray-900">首页</Link>
            <Link href="/notehub/explore" className="text-[#9e1b32] font-medium">广场</Link>
            <Link href="/notehub/workspace" className="text-gray-600 hover:text-gray-900">工作区</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">笔记广场</h1>
          <p className="text-gray-600">发现社区中分享的公开笔记和文件</p>
        </div>

        {/* 公开笔记 */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span>📝</span> 公开笔记
          </h2>
          {notes.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-xl shadow-sm">
              <p className="text-gray-500">暂无公开笔记</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {notes.map((note) => (
                <Link
                  key={note.id}
                  href={`/notes/${note.id}`}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow block"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-semibold text-lg text-gray-800 line-clamp-2">
                      {note.title}
                    </h3>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      笔记
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">作者:</span>
                      <span className="font-medium text-gray-700">{note.author}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">创建:</span>
                      <span>{new Date(note.created_at).toLocaleDateString('zh-CN')}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {note.content || "暂无内容摘要"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* 公开文件 */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span>📎</span> 公开文件
          </h2>
          {files.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-xl shadow-sm">
              <p className="text-gray-500">暂无公开文件</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {files.map((file) => (
                <a
                  key={file.id}
                  href={`/api/files?filename=${file.filename}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow block"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-semibold text-lg text-gray-800 line-clamp-2">
                      {file.original_name}
                    </h3>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      {file.mime_type.includes('pdf') ? 'PDF' : '文件'}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">作者:</span>
                      <span className="font-medium text-gray-700">{file.uploaded_by}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">大小:</span>
                      <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">上传:</span>
                      <span>{new Date(file.uploaded_at).toLocaleDateString('zh-CN')}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <span className="text-[#9e1b32] text-sm font-medium">
                      点击下载 →
                    </span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
