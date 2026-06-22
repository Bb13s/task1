import { NextRequest, NextResponse } from 'next/server';
import { updateAlbum, deleteAlbum } from '@/lib/db';
import { requireDeveloper } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireDeveloper();

    const id = parseInt(params.id);
    const { name, description } = await request.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Album name is required' }, { status: 400 });
    }

    const success = updateAlbum(id, name.trim(), description || null);
    if (success) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Album not found' }, { status: 404 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: '仅开发者可管理专辑' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to update album' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireDeveloper();

    const id = parseInt(params.id);
    const success = deleteAlbum(id);
    if (success) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Album not found' }, { status: 404 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: '仅开发者可管理专辑' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to delete album' }, { status: 500 });
  }
}
