import { getNoteById } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import "katex/dist/katex.min.css";

interface NotePageProps {
  params: { id: string };
}

export default function NoteDetailPage({ params }: NotePageProps) {
  const noteId = parseInt(params.id);
  const note = getNoteById(noteId, "demo");

  if (!note) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="font-bold text-xl text-gray-800">NoteHub</span>
          </div>
          <nav className="flex gap-4">
            <Link href="/notehub" className="text-gray-600 hover:text-gray-900">首页</Link>
            <Link href="/notehub/explore" className="text-gray-600 hover:text-gray-900">广场</Link>
            <Link href="/notehub/workspace" className="text-purple-600 font-medium">工作区</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">{note.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>👤 {note.author}</span>
              <span>📁 {note.folder_path}</span>
              <span>📅 {new Date(note.created_at).toLocaleDateString("zh-CN")}</span>
              {note.is_public === 1 && (
                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">
                  公开
                </span>
              )}
            </div>
          </div>

          <div className="prose prose-lg max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                code({ className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || "");
                  return match ? (
                    <SyntaxHighlighter
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {note.content || "*暂无内容*"}
            </ReactMarkdown>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-4">
          <Link
            href="/notehub/explore"
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            ← 返回广场
          </Link>
          <span className="text-gray-300">|</span>
          <Link
            href={`/notehub/workspace?note=${note.id}`}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-medium"
          >
            ✏️ 在工作区编辑
          </Link>
        </div>
      </main>
    </div>
  );
}
