import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { createFileRecord } from '@/lib/db';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// 允许 PDF 和 Markdown 文件
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'text/markdown',
  'text/plain',
];

// 最大文件大小 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    // 确保上传目录存在
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const noteId = formData.get('noteId') as string | null;
    const folderPath = (formData.get('folderPath') as string) || '/';

    if (!file) {
      return NextResponse.json(
        { error: '没有找到文件' },
        { status: 400 }
      );
    }

    // 验证文件类型
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `不支持的文件类型: ${file.type}` },
        { status: 400 }
      );
    }

    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `文件太大，最大允许 10MB` },
        { status: 400 }
      );
    }

    // 生成唯一文件名
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const originalName = file.name;
    const ext = path.extname(originalName);
    const filename = `${timestamp}-${randomStr}${ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    // 读取文件内容并保存
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // 保存到数据库
    const fileRecord = createFileRecord(
      filename,
      originalName,
      file.type,
      file.size,
      `/api/files/${filename}`,
      'demo',
      folderPath,
      noteId ? parseInt(noteId) : null
    );

    return NextResponse.json({
      success: true,
      file: {
        id: fileRecord.id,
        filename: fileRecord.filename,
        originalName: fileRecord.original_name,
        mimeType: fileRecord.mime_type,
        size: fileRecord.size,
        url: fileRecord.path,
        uploadedAt: fileRecord.uploaded_at,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: '上传失败，请重试' },
      { status: 500 }
    );
  }
}
