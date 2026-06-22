import { NextResponse } from 'next/server';
import { getAllAlbums } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const albums = getAllAlbums();
    return NextResponse.json({ albums });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch albums' }, { status: 500 });
  }
}
