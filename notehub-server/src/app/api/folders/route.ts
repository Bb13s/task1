import { NextRequest, NextResponse } from 'next/server';
import { getAllFolders, createFolder } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const author = searchParams.get('author') || 'demo';
    const folders = getAllFolders(author);
    return NextResponse.json({ folders });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, parentId, author } = body;

    if (!name || !author) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const folder = createFolder(name, parentId || null, author);
    return NextResponse.json({ folder });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 });
  }
}
