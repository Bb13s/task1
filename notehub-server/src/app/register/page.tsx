'use client';

import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-[#9e1b32] to-[#4A2887] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-xl">N</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">注册 NoteHub</h1>
          <p className="text-gray-500 mt-2">创建您的账号，开始记录</p>
        </div>

        <div className="p-6 bg-gray-50 rounded-xl text-center">
          <div className="text-4xl mb-4">🔒</div>
          <p className="text-gray-700 font-medium mb-2">账号注册功能已关闭！</p>
          <p className="text-gray-500 text-sm">如有需要，请联系管理员手动开通</p>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-block w-full py-2.5 bg-[#9e1b32] text-white rounded-lg hover:bg-[#7a1527] transition-colors font-medium"
          >
            前往登录
          </Link>
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">
            ← 返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
