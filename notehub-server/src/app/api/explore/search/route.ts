import { NextRequest, NextResponse } from 'next/server';
import { searchExplore } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword') || null;
    const albumIdStr = searchParams.get('albumId');
    const albumId = albumIdStr ? parseInt(albumIdStr) : null;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '12')));

    const result = searchExplore(keyword, albumId, page, pageSize);

    return NextResponse.json({
      items: result.items,
      total: result.total,
      page,
      pageSize,
    }, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
