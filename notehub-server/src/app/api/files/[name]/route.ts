import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { getFileByFilename } from '@/lib/db';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const filename = params.name;

    // 安全检查：防止路径遍历攻击
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json(
        { error: '非法文件名' },
        { status: 400 }
      );
    }

    // 从数据库获取文件记录
    const fileRecord = getFileByFilename(filename);
    if (!fileRecord) {
      return NextResponse.json(
        { error: '文件不存在' },
        { status: 404 }
      );
    }

    const filePath = path.join(UPLOAD_DIR, filename);

    // 读取文件
    const fileBuffer = await readFile(filePath);

    // 设置响应头
    const headers = new Headers();
    headers.set('Content-Type', fileRecord.mime_type);
    headers.set('Content-Length', fileBuffer.length.toString());

    // 如果是图片或文本，允许在浏览器中预览
    const inlineTypes = ['image/', 'text/', 'application/pdf'];
    const isInline = inlineTypes.some(type => fileRecord.mime_type.startsWith(type));
    const disposition = isInline ? 'inline' : 'attachment';
    headers.set(
      'Content-Disposition',
      `${disposition}; filename="${encodeURIComponent(fileRecord.original_name)}"`
    );

    // 缓存控制
    headers.set('Cache-Control', 'public, max-age=31536000'); // 1年缓存

    return new NextResponse(fileBuffer, { headers });
  } catch (error) {
    console.error('File download error:', error);
    return NextResponse.json(
      { error: '文件读取失败' },
      { status: 500 }
    );
  }
}
