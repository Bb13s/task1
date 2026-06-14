'use client';

import Link from "next/link";
import { useEffect, useState } from "react";

export default function UserNav() {
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Not logged in');
      })
      .then(data => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="w-20 h-8 bg-gray-100 rounded animate-pulse" />;
  }

  if (user) {
    return (
      <Link
        href="/notehub/workspace"
        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
      >
        进入工作区
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/notehub/login"
        className="text-gray-600 hover:text-gray-900 px-3 py-2"
      >
        登录
      </Link>
      <Link
        href="/notehub/login"
        className="text-gray-600 hover:text-gray-900 px-3 py-2"
      >
        登录
      </Link>
      <span className="bg-gray-300 text-gray-500 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed">
        注册已关闭
      </span>
    </div>
  );
}
