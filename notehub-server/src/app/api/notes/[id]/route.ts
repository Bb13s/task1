import { NextRequest, NextResponse } from 'next/server';
import { updateNote, deleteNote } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const { title, content, folder_path, is_public, album_id } = body;

    const updates: Partial<{ title: string; content: string; folder_path: string; is_public: number; album_id: number | null }> = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (folder_path !== undefined) updates.folder_path = folder_path;
    if (is_public !== undefined) updates.is_public = is_public;
    if (album_id !== undefined) updates.album_id = album_id;

    const success = updateNote(id, updates, 'demo');
    if (success) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Note not found' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const success = deleteNote(id, 'demo');
    if (success) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Note not found' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
