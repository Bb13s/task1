'use client';

import { useState, useRef, useCallback } from 'react';

interface FileRecord {
  id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  path: string;
  uploaded_at: string;
  is_public?: number;
}

interface FileManagerProps {
  files: FileRecord[];
  onFilesChange: () => void;
}

export default function FileManager({ files, onFilesChange }: FileManagerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 判断是否为图片
  const isImage = (mimeType: string): boolean => {
    return mimeType.startsWith('image/');
  };

  // 上传文件
  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(`正在上传: ${file.name}`);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setUploadProgress('上传成功!');
        onFilesChange();
      } else {
        setUploadProgress(`上传失败: ${data.error}`);
      }
    } catch (error) {
      setUploadProgress('上传出错，请重试');
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress('');
      }, 2000);
    }
  };

  // 处理文件选择
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };

  // 处理拖拽事件
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  }, [onFilesChange]);

  // 删除文件
  const handleDelete = async (fileId: number) => {
    if (!confirm('确定要删除这个文件吗？')) return;

    try {
      const response = await fetch(`/api/files?id=${fileId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onFilesChange();
      } else {
        alert('删除失败');
      }
    } catch (error) {
      alert('删除出错');
    }
  };

  // 发布/取消发布文件到广场
  const handleTogglePublic = async (file: FileRecord) => {
    const newStatus = file.is_public === 1 ? 0 : 1;
    const action = newStatus === 1 ? '公开' : '取消公开';

    try {
      const response = await fetch(`/api/files?id=${file.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_public: newStatus }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        onFilesChange();
      } else {
        alert(data.error || '操作失败');
      }
    } catch (error) {
      alert('操作出错');
    }
  };

  // 复制文件链接
  const copyFileUrl = (url: string) => {
    const fullUrl = window.location.origin + url;
    navigator.clipboard.writeText(fullUrl);
    alert('链接已复制到剪贴板');
  };

  // 复制 Markdown 图片语法
  const copyMarkdownImage = (file: FileRecord) => {
    const fullUrl = window.location.origin + file.path;
    const markdown = `![${file.original_name}](${fullUrl})`;
    navigator.clipboard.writeText(markdown);
    alert('Markdown 图片语法已复制');
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 上传区域 */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <h3 className="font-semibold text-gray-800 mb-3">文件管理</h3>

        {/* 拖拽上传区域 */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            transition-colors duration-200
            ${isDragging
              ? 'border-[#9e1b32] bg-[#9e1b32]/5'
              : 'border-gray-300 hover:border-gray-400 bg-gray-50'
            }
            ${isUploading ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="text-3xl mb-2">📁</div>
          <p className="text-sm text-gray-600">
            {isDragging ? '松开以上传文件' : '点击或拖拽文件到此处上传'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            支持 PDF、Markdown 文件，最大 10MB
          </p>
        </div>

        {/* 上传进度 */}
        {isUploading && (
          <div className="mt-3 p-2 bg-[#9e1b32]/5 text-[#9e1b32] text-sm rounded">
            {uploadProgress}
          </div>
        )}
      </div>

      {/* 文件列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        {files.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <div className="text-4xl mb-2">📂</div>
            <p className="text-sm">暂无文件</p>
          </div>
        ) : (
          <div className="space-y-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="bg-white rounded-lg p-3 border border-gray-200 hover:border-gray-300 transition-colors"
              >
                {/* 文件预览/图标 */}
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center shrink-0 overflow-hidden">
                    {isImage(file.mime_type) ? (
                      <img
                        src={file.path}
                        alt={file.original_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xl">
                        {file.mime_type.includes('pdf') ? '📄' :
                          file.mime_type.includes('word') ? '📝' :
                            file.mime_type.includes('sheet') ? '📊' :
                              file.mime_type.includes('presentation') ? '📽️' :
                                file.mime_type.includes('text') || file.mime_type.includes('markdown') ? '📃' : '📦'}
                      </span>
                    )}
                  </div>

                  {/* 文件信息 */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm truncate">
                      {file.original_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)} • {new Date(file.uploaded_at).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => copyFileUrl(file.path)}
                    className="flex-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
                  >
                    复制链接
                  </button>
                  {isImage(file.mime_type) && (
                    <button
                      onClick={() => copyMarkdownImage(file)}
                      className="flex-1 px-2 py-1 text-xs bg-[#9e1b32]/10 hover:bg-[#9e1b32]/20 rounded text-[#9e1b32] transition-colors"
                    >
                      MD 图片
                    </button>
                  )}
                  <a
                    href={file.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 rounded text-blue-700 transition-colors"
                  >
                    查看
                  </a>
                  <button
                    onClick={() => handleTogglePublic(file)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      file.is_public === 1
                        ? 'bg-green-100 hover:bg-green-200 text-green-700'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                    title={file.is_public === 1 ? '点击取消公开' : '点击公开到广场'}
                  >
                    {file.is_public === 1 ? '🌐 已公开' : '🔒 公开'}
                  </button>
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 rounded text-red-700 transition-colors"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 底部统计 */}
      <div className="p-3 border-t border-gray-200 bg-white text-xs text-gray-500 text-center">
        共 {files.length} 个文件，总大小 {formatFileSize(files.reduce((sum, f) => sum + f.size, 0))}
      </div>
    </div>
  );
}
