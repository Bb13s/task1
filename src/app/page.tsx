import Link from "next/link";
import { getPublicNotes } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export default function HomePage() {
  let notes: any[] = [];
  try {
    notes = getPublicNotes();
  } catch (error) {
    console.error('Failed to fetch public notes:', error);
  }
  const user = getCurrentUser();
  const recentNotes = notes.slice(0, 6);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="font-bold text-xl text-gray-800">NoteHub</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/" className="text-purple-600 font-medium">首页</Link>
            <Link href="/explore" className="text-gray-600 hover:text-gray-900">广场</Link>
            <Link href="/workspace" className="text-gray-600 hover:text-gray-900">工作区</Link>
            <div className="w-px h-4 bg-gray-300"></div>
            {user ? (
              <Link
                href="/workspace"
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                进入工作区
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2"
                >
                  登录
                </Link>
                <Link
                  href="/register"
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                >
                  注册
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
              重建物院巴别塔
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            由 Bb13s 尝试开发，支持 Markdown 及其公式渲染，PDF 文件的上传与发布正在测试。
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/workspace"
              className="bg-purple-600 text-white px-8 py-3 rounded-xl hover:bg-purple-700 transition-colors font-medium text-lg"
            >
              开始使用
            </Link>
            <Link
              href="/explore"
              className="bg-white text-purple-600 border-2 border-purple-600 px-8 py-3 rounded-xl hover:bg-purple-50 transition-colors font-medium text-lg"
            >
              浏览广场
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">功能特性</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-gray-50 hover:bg-purple-50 transition-colors">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-xl font-semibold mb-2">Markdown 编辑器</h3>
              <p className="text-gray-600">支持 CodeMirror 6，语法高亮、实时预览，写作体验流畅</p>
            </div>
            <div className="p-6 rounded-xl bg-gray-50 hover:bg-purple-50 transition-colors">
              <div className="text-4xl mb-4">🌐</div>
              <h3 className="text-xl font-semibold mb-2">可选公开</h3>
              <p className="text-gray-600">让社区伙伴看到你的笔记与文件，方便资料流通，知识共享</p>
            </div>
            <div className="p-6 rounded-xl bg-gray-50 hover:bg-purple-50 transition-colors">
              <div className="text-4xl mb-4">📁</div>
              <h3 className="text-xl font-semibold mb-2">文件夹管理</h3>
              <p className="text-gray-600">无限层级嵌套，拖拽移动，Obsidian 风格树状导航</p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Notes */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">最新公开笔记</h2>
            <Link href="/explore" className="text-purple-600 hover:text-purple-700 font-medium">
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

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500">
          <p>© 2026 华中科技大学物理学院辩论队</p>
        </div>
      </footer>
    </div>
  );
}
