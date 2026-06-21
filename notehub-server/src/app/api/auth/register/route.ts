import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createUser, getUserByUsername } from '@/lib/db';

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: '账号注册功能已关闭！如有需要请联系管理员手动开通' },
    { status: 403 }
  );
}
