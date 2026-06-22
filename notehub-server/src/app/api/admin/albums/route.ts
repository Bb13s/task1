import { NextRequest, NextResponse } from 'next/server';
import { createAlbum } from '@/lib/db';
import { requireDeveloper } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    requireDeveloper();

    const { name, description } = await request.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Album name is required' }, { status: 400 });
    }

    const album = createAlbum(name.trim(), description || null);
    return NextResponse.json({ album }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: '仅开发者可管理专辑' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to create album' }, { status: 500 });
  }
}
