import { NextRequest, NextResponse } from 'next/server';
import { updateFolder, deleteFolder } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: 'Missing name' }, { status: 400 });
    }

    const success = updateFolder(id, name, 'demo');
    if (success) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update folder' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const success = deleteFolder(id, 'demo');
    if (success) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 });
  }
}
