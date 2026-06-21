'use client';

import { useEffect, useState } from 'react';
import { FileRecord } from '@/lib/db';

interface FilePreviewProps {
  file: FileRecord | null;
}

export default function FilePreview({ file }: FilePreviewProps) {
  const [fileUrl, setFileUrl] = useState<string>('');

  useEffect(() => {
    if (!file) {
      setFileUrl('');
      return;
    }

    // 构建完整 URL
    const url = window.location.origin + file.path;
    setFileUrl(url);
  }, [file]);

  if (!file) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400">
        <div className="text-6xl mb-4">👁️</div>
        <p className="text-lg">选择一个文件预览</p>
      </div>
    );
  }

  const isImage = file.mime_type.startsWith('image/');
  const isPDF = file.mime_type === 'application/pdf';
  const isText = file.mime_type.startsWith('text/') ||
                 file.mime_type.includes('json') ||
                 file.mime_type.includes('javascript');
  const isMarkdown = file.mime_type.includes('markdown') || file.original_name.endsWith('.md');

  // 图片预览
  if (isImage) {
    return (
      <div className="h-full flex flex-col bg-gray-50 overflow-auto">
        <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-800">{file.original_name}</h3>
            <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
          <a
            href={fileUrl}
            download={file.original_name}
            className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded text-sm hover:bg-purple-200 transition-colors"
          >
            ⬇️ 下载
          </a>
        </div>
        <div className="flex-1 p-4 flex items-center justify-center">
          <img
            src={file.path}
            alt={file.original_name}
            className="max-w-full max-h-full object-contain shadow-lg rounded"
          />
        </div>
      </div>
    );
  }

  // PDF 预览
  if (isPDF) {
    return (
      <div className="h-full flex flex-col bg-gray-50">
        <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-800">{file.original_name}</h3>
            <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
          <div className="flex gap-2">
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors"
            >
              新窗口打开
            </a>
            <a
              href={fileUrl}
              download={file.original_name}
              className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded text-sm hover:bg-purple-200 transition-colors"
            >
              ⬇️ 下载
            </a>
          </div>
        </div>
        <div className="flex-1 p-4">
          <iframe
            src={file.path}
            className="w-full h-full border rounded-lg bg-white"
            title={file.original_name}
          />
        </div>
      </div>
    );
  }

  // 文本/Markdown 预览
  if (isText || isMarkdown) {
    return (
      <div className="h-full flex flex-col bg-gray-50">
        <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-800">{file.original_name}</h3>
            <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
          <a
            href={fileUrl}
            download={file.original_name}
            className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded text-sm hover:bg-purple-200 transition-colors"
          >
            ⬇️ 下载
          </a>
        </div>
        <div className="flex-1 p-4 overflow-auto">
          <iframe
            src={file.path}
            className="w-full h-full border rounded-lg bg-white"
            title={file.original_name}
          />
        </div>
      </div>
    );
  }

  // 其他文件 - 显示下载提示
  return (
    <div className="h-full flex flex-col items-center justify-center text-gray-500 bg-gray-50">
      <div className="text-6xl mb-4">📎</div>
      <h3 className="text-lg font-medium text-gray-700 mb-2">{file.original_name}</h3>
      <p className="text-sm mb-4">{(file.size / 1024).toFixed(1)} KB</p>
      <p className="text-sm text-gray-400 mb-6">该文件类型暂不支持预览</p>
      <a
        href={fileUrl}
        download={file.original_name}
        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
      >
        ⬇️ 下载文件
      </a>
    </div>
  );
}
