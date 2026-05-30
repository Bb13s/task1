import { NextRequest, NextResponse } from 'next/server';
import { getAllNotes, createNote } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const author = searchParams.get('author') || 'demo';
    const notes = getAllNotes(author);
    return NextResponse.json({ notes });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, folderPath, author, isPublic } = body;

    if (!title || !author) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const note = createNote(title, content || '', folderPath || '/', author, isPublic || 0);
    return NextResponse.json({ note });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}
