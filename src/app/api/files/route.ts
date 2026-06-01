import { NextRequest, NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import path from 'path';
import { cookies } from 'next/headers';
import { getFilesByUploader, deleteFileRecord, getFileById, getFileByFilename, updateFilePublicStatus, getSessionById, getUserById, getPublicFiles, db } from '@/lib/db';
import { readFile } from 'fs/promises';

export const dynamic = 'force-dynamic';

// 在 API Route 中获取当前用户
function getCurrentUserFromCookies() {
  const cookieStore = cookies();
  const sessionId = cookieStore.get('session_id')?.value;

  if (!sessionId) {
    return null;
  }

  const session = getSessionById(sessionId);
  if (!session) {
    return null;
  }

  const user = getUserById(session.user_id);
  return user || null;
}

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// 获取文件列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const debug = searchParams.get('debug');

    // 调试端点：检查数据库表结构
    if (debug === 'schema') {
      const columns = db.prepare('PRAGMA table_info(files)').all();
      return NextResponse.json({ columns });
    }

    const author = searchParams.get('author');
    const filename = searchParams.get('filename');
    const fileId = searchParams.get('id');
    const isPublic = searchParams.get('public');

    // 获取公开文件列表（无需登录）
    if (isPublic === 'true') {
      const files = getPublicFiles();
      return NextResponse.json(
        { files },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        }
      );
    }

    // 如果提供了文件名，返回文件内容（下载）
    if (filename) {
      // 安全检查
      if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return NextResponse.json(
          { error: '非法文件名' },
          { status: 400 }
        );
      }

      const fileRecord = getFileByFilename(filename);
      if (!fileRecord) {
        return NextResponse.json(
          { error: '文件不存在' },
          { status: 404 }
        );
      }

      const filePath = path.join(UPLOAD_DIR, filename);
      const fileBuffer = await readFile(filePath);

      const headers = new Headers();
      headers.set('Content-Type', fileRecord.mime_type);
      headers.set('Content-Length', fileBuffer.length.toString());

      const inlineTypes = ['image/', 'text/', 'application/pdf'];
      const isInline = inlineTypes.some(type => fileRecord.mime_type.startsWith(type));
      const disposition = isInline ? 'inline' : 'attachment';
      headers.set(
        'Content-Disposition',
        `${disposition}; filename="${encodeURIComponent(fileRecord.original_name)}"`
      );
      headers.set('Cache-Control', 'public, max-age=31536000');

      return new NextResponse(fileBuffer, { headers });
    }

    // 获取当前用户
    const user = getCurrentUserFromCookies();
    if (!user) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    // 如果提供了文件ID，返回单个文件信息
    if (fileId) {
      const file = getFileById(parseInt(fileId));
      if (!file || file.uploaded_by !== user.username) {
        return NextResponse.json(
          { error: '文件不存在' },
          { status: 404 }
        );
      }
      return NextResponse.json({ file });
    }

    // 否则返回文件列表
    const files = getFilesByUploader(user.username);
    return NextResponse.json(
      { files },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    console.error('Get files error:', error);
    return NextResponse.json(
      { error: '获取文件列表失败' },
      { status: 500 }
    );
  }
}

// 更新文件（公开/取消公开）
export async function PATCH(request: NextRequest) {
  try {
    const user = getCurrentUserFromCookies();
    if (!user) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('id');

    if (!fileId) {
      return NextResponse.json(
        { error: '缺少文件ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { is_public } = body;

    if (is_public === undefined) {
      return NextResponse.json(
        { error: '缺少 is_public 参数' },
        { status: 400 }
      );
    }

    const success = updateFilePublicStatus(parseInt(fileId), is_public ? 1 : 0, user.username);

    if (!success) {
      return NextResponse.json(
        { error: '文件不存在或无权限', debug: { fileId, username: user.username } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: is_public ? '文件已公开到广场' : '文件已取消公开',
    });
  } catch (error: any) {
    console.error('Update file error:', error);
    return NextResponse.json(
      { error: '更新失败', message: error.message },
      { status: 500 }
    );
  }
}

// 删除文件
export async function DELETE(request: NextRequest) {
  try {
    const user = getCurrentUserFromCookies();
    if (!user) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('id');

    if (!fileId) {
      return NextResponse.json(
        { error: '缺少文件ID' },
        { status: 400 }
      );
    }

    const fileRecord = getFileById(parseInt(fileId));
    if (!fileRecord || fileRecord.uploaded_by !== user.username) {
      return NextResponse.json(
        { error: '文件不存在或无权限' },
        { status: 404 }
      );
    }

    // 删除物理文件
    const filePath = path.join(UPLOAD_DIR, fileRecord.filename);
    try {
      await unlink(filePath);
    } catch (err) {
      console.error('Delete physical file error:', err);
    }

    // 删除数据库记录
    const success = deleteFileRecord(parseInt(fileId), user.username);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: '删除失败' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Delete file error:', error);
    return NextResponse.json(
      { error: '删除文件失败' },
      { status: 500 }
    );
  }
}
