'use client';

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AppPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<any[]>([]);
  const [showLogin, setShowLogin] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        setUser(data.user);
        // 已登录，获取公开笔记
        fetch('/api/notes?public=true')
          .then(res => res.json())
          .then(data => setNotes(data.notes || []))
          .catch(() => {});
      })
      .catch(() => {
        // 未登录，显示登录弹窗
        setShowLogin(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setShowLogin(false);
        // 获取公开笔记
        fetch('/api/notes?public=true')
          .then(res => res.json())
          .then(data => setNotes(data.notes || []))
          .catch(() => {});
      } else {
        const data = await res.json();
        setLoginError(data.error || '登录失败');
      }
    } catch (err) {
      setLoginError('网络错误');
    } finally {
      setLoginLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  const recentNotes = notes.slice(0, 6);

  return (
    <div className="min-h-screen bg-gradient-to-br bg-gray-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#9e1b32] to-[#4A2887] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="font-bold text-xl text-gray-800">NoteHub</span>
          </div>
          <nav className="flex items-center gap-4">
            <a href={process.env.NEXT_PUBLIC_MAIN_SITE_URL || "/"} className="text-gray-600 hover:text-gray-900 text-sm">← 返回官网</a>
            <Link href="/" className="text-[#9e1b32] font-medium">首页</Link>
            {user ? (
              <>
                <Link href="/explore" className="text-gray-600 hover:text-gray-900">广场</Link>
                <Link href="/workspace" className="text-gray-600 hover:text-gray-900">工作区</Link>
              </>
            ) : null}
            <div className="w-px h-4 bg-gray-300"></div>
            {user ? (
              <span className="text-sm text-gray-600">{user.username}</span>
            ) : null}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            <span className="bg-gradient-to-r from-[#9e1b32] to-[#4A2887] bg-clip-text text-transparent">
              欢迎来到——物院巴别塔
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            个人知识库管理、物院资源共享平台。现已支持新建Markdown、上传PDF以及所有工作区文件的公开！
          </p>
          {user ? (
            <div className="flex items-center justify-center gap-4">
              <Link
                href="/workspace"
                className="bg-[#9e1b32] text-white px-8 py-3 rounded-xl hover:bg-[#7a1527] transition-colors font-medium text-lg"
              >
                开始使用
              </Link>
              <Link
                href="/explore"
                className="bg-white text-[#9e1b32] border-2 border-[#9e1b32] px-8 py-3 rounded-xl hover:bg-[#9e1b32]/5 transition-colors font-medium text-lg"
              >
                浏览广场
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      {/* Features */}
      {user ? (
        <>
          <section className="py-16 bg-white">
            <div className="max-w-6xl mx-auto px-4">
              <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">功能特性</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="p-6 rounded-xl bg-gray-50 hover:bg-[#9e1b32]/5 transition-colors">
                  <div className="text-4xl mb-4">📝</div>
                  <h3 className="text-xl font-semibold mb-2">Markdown 编辑器</h3>
                  <p className="text-gray-600">支持 CodeMirror 6，语法高亮、实时预览，写作体验流畅</p>
                </div>
                <div className="p-6 rounded-xl bg-gray-50 hover:bg-[#9e1b32]/5 transition-colors">
                  <div className="text-4xl mb-4">🌐</div>
                  <h3 className="text-xl font-semibold mb-2">可选公开</h3>
                  <p className="text-gray-600">让社区伙伴看到你的笔记与文件，方便资料流通，知识共享</p>
                </div>
                <div className="p-6 rounded-xl bg-gray-50 hover:bg-[#9e1b32]/5 transition-colors">
                  <div className="text-4xl mb-4">📁</div>
                  <h3 className="text-xl font-semibold mb-2">文件夹管理</h3>
                  <p className="text-gray-600">无限层级嵌套，Obsidian 风格树状导航</p>
                </div>
              </div>
            </div>
          </section>

          <section className="py-16 px-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900">最新公开笔记</h2>
                <Link href="/explore" className="text-[#9e1b32] hover:text-[#7a1527] font-medium">
                  查看全部 →
                </Link>
              </div>

              {recentNotes.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无公开笔记</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recentNotes.map((note) => (
                    <Link
                      key={note.id}
                      href={`/notes/${note.id}`}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow block"
                    >
                      <h3 className="font-semibold text-lg text-gray-800 mb-2 line-clamp-1">
                        {note.title}
                      </h3>
                      <p className="text-sm text-gray-500 mb-3">👤 {note.author}</p>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {note.content || "暂无内容摘要"}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      ) : null}

      {/* Footer */}
      <footer className="bg-[#0f172a] border-t border-gray-800 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500">
          <p className="text-gray-500">© 2026 华中科技大学物理学院辩论队</p>
        </div>
      </footer>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 mx-4">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-[#9e1b32] to-[#4A2887] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-white font-bold text-2xl">N</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">知识库登录</h2>
              <p className="text-gray-500 mt-3 px-4 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm border border-amber-200">
                知识库服务仅向内部人员开放，如有账号请登录
              </p>
            </div>

            {loginError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9e1b32] focus:border-transparent outline-none transition-all"
                  placeholder="输入用户名"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9e1b32] focus:border-transparent outline-none transition-all"
                  placeholder="输入密码"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-2.5 bg-[#9e1b32] text-white rounded-lg hover:bg-[#7a1527] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loginLoading ? '登录中...' : '登录'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <span className="text-sm text-gray-400">账号注册功能已关闭</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
