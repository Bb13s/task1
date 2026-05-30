import { NextRequest, NextResponse } from 'next/server';
import { deleteSession } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const sessionId = cookieStore.get('session_id')?.value;

    if (sessionId) {
      // 删除数据库中的 session
      deleteSession(sessionId);

      // 清除 cookie
      cookieStore.delete('session_id');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: '退出失败' },
      { status: 500 }
    );
  }
}
