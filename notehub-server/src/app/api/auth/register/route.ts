import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createUser, getUserByUsername } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !username.trim()) {
      return NextResponse.json({ error: '用户名不能为空' }, { status: 400 });
    }
    if (!password || password.length < 3) {
      return NextResponse.json({ error: '密码至少3位' }, { status: 400 });
    }

    const existing = getUserByUsername(username.trim());
    if (existing) {
      return NextResponse.json({ error: '用户名已存在' }, { status: 409 });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const user = createUser(username.trim(), passwordHash);

    return NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username, created_at: user.created_at },
    }, { status: 201 });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: '注册失败，请重试' }, { status: 500 });
  }
}
