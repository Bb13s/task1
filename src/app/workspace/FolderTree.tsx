'use client';

import { useState, useRef, useEffect } from 'react';
import { Folder, Note, FileRecord } from '@/lib/db';

interface TreeNode {
  id: number | null;
  name: string;
  path: string;
  children: TreeNode[];
  notes: Note[];
  files: FileRecord[];
}

interface FolderTreeProps {
  folders: Folder[];
  notes: Note[];
  files: FileRecord[];
  selectedFolder: string;
  selectedNoteId: number | null;
  selectedFileId: number | null;
  onSelectFolder: (path: string) => void;
  onSelectNote: (note: Note) => void;
  onSelectFile: (file: FileRecord) => void;
  onCreateFolder: (name: string, parentId: number | null) => void;
  onCreateNote: (folderPath: string) => void;
  onDeleteFolder: (id: number) => void;
  onDeleteNote: (id: number) => void;
  onMoveNote: (noteId: number, folderPath: string) => void;
  onUploadFile: (folderPath: string, file: File) => void;
  onDeleteFile: (fileId: number) => void;
  onRefreshFiles: () => void;
  onDownloadFolder?: (folderPath: string) => void;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  type: 'folder' | 'note' | 'root' | 'file';
  targetId: number | null;
  targetPath?: string;
}

export default function FolderTree({
  folders,
  notes,
  files,
  selectedFolder,
  selectedNoteId,
  selectedFileId,
  onSelectFolder,
  onSelectNote,
  onSelectFile,
  onCreateFolder,
  onCreateNote,
  onDeleteFolder,
  onDeleteNote,
  onMoveNote,
  onUploadFile,
  onDeleteFile,
  onRefreshFiles,
  onDownloadFolder,
}: FolderTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<number | null>>(new Set([null]));
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    type: 'root',
    targetId: null,
  });
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolderParent, setCreatingFolderParent] = useState<number | null>(null);
  const [draggingNote, setDraggingNote] = useState<number | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetFolder, setUploadTargetFolder] = useState<string>('/');
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreatingFolder && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreatingFolder]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(prev => ({ ...prev, visible: false }));
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const buildTree = (): TreeNode => {
    const root: TreeNode = { id: null, name: '根目录', path: '/', children: [], notes: [], files: [] };
    const folderMap = new Map<number | null, TreeNode>();
    folderMap.set(null, root);

    folders.forEach(folder => {
      const node: TreeNode = {
        id: folder.id,
        name: folder.name,
        path: getFolderPath(folder.id),
        children: [],
        notes: [],
        files: [],
      };
      folderMap.set(folder.id, node);
    });

    folders.forEach(folder => {
      const node = folderMap.get(folder.id)!;
      const parent = folderMap.get(folder.parent_id) || root;
      parent.children.push(node);
    });

    notes.forEach(note => {
      const targetPath = note.folder_path || '/';
      let added = false;
      folderMap.forEach((node) => {
        if (node.path === targetPath) {
          node.notes.push(note);
          added = true;
        }
      });
      if (!added) {
        root.notes.push(note);
      }
    });

    files.forEach(file => {
      const targetPath = file.folder_path || '/';
      let added = false;
      folderMap.forEach((node) => {
        if (node.path === targetPath) {
          node.files.push(file);
          added = true;
        }
      });
      if (!added) {
        root.files.push(file);
      }
    });

    return root;
  };

  const getFolderPath = (folderId: number | null): string => {
    if (!folderId) return '/';
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return '/';
    if (!folder.parent_id) return `/${folder.name}`;
    const parentPath = getFolderPath(folder.parent_id);
    return parentPath === '/' ? `/${folder.name}` : `${parentPath}/${folder.name}`;
  };

  const toggleFolder = (folderId: number | null) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleContextMenu = (e: React.MouseEvent, type: 'folder' | 'note' | 'root' | 'file', targetId: number | null, targetPath?: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      type,
      targetId,
      targetPath,
    });
  };

  const handleCreateFolder = () => {
    const parentId = contextMenu.type === 'folder' ? contextMenu.targetId : null;
    setCreatingFolderParent(parentId);
    setIsCreatingFolder(true);
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const submitCreateFolder = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim(), creatingFolderParent);
      setNewFolderName('');
      setIsCreatingFolder(false);
      setCreatingFolderParent(null);
      if (creatingFolderParent !== undefined) {
        setExpandedFolders(prev => new Set(prev).add(creatingFolderParent));
      }
    }
  };

  const handleCreateNote = () => {
    const folderPath = contextMenu.type === 'folder' && contextMenu.targetId !== null
      ? getFolderPath(contextMenu.targetId)
      : '/';
    onCreateNote(folderPath);
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const handleDelete = () => {
    if (contextMenu.type === 'folder' && contextMenu.targetId) {
      if (confirm('确定要删除这个文件夹吗？其中的笔记和文件将被移动到根目录。')) {
        onDeleteFolder(contextMenu.targetId);
      }
    } else if (contextMenu.type === 'note' && contextMenu.targetId) {
      if (confirm('确定要删除这个笔记吗？')) {
        onDeleteNote(contextMenu.targetId);
      }
    } else if (contextMenu.type === 'file' && contextMenu.targetId) {
      if (confirm('确定要删除这个文件吗？')) {
        onDeleteFile(contextMenu.targetId);
      }
    }
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const handleDragStart = (e: React.DragEvent, noteId: number) => {
    setDraggingNote(noteId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, folderPath: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverFolder(folderPath);
  };

  const handleDragLeave = () => {
    setDragOverFolder(null);
  };

  const handleDrop = (e: React.DragEvent, folderPath: string) => {
    e.preventDefault();
    if (draggingNote !== null) {
      onMoveNote(draggingNote, folderPath);
      setDraggingNote(null);
      setDragOverFolder(null);
    }
  };

  const handleFileDrop = (e: React.DragEvent, folderPath: string) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onUploadFile(folderPath, file);
    }
    setDragOverFolder(null);
  };

  const handleUploadClick = () => {
    const folderPath = contextMenu.type === 'folder' && contextMenu.targetId !== null
      ? getFolderPath(contextMenu.targetId)
      : '/';
    setUploadTargetFolder(folderPath);
    setContextMenu(prev => ({ ...prev, visible: false }));
    fileInputRef.current?.click();
  };

  const handleDownloadFolder = () => {
    const folderPath = contextMenu.type === 'folder' && contextMenu.targetId !== null
      ? getFolderPath(contextMenu.targetId)
      : '/';
    if (onDownloadFolder) {
      onDownloadFolder(folderPath);
    }
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadFile(uploadTargetFolder, file);
    }
    e.target.value = '';
  };

  const copyFileMarkdown = (file: FileRecord) => {
    const fullUrl = window.location.origin + file.path;
    if (file.mime_type.startsWith('image/')) {
      navigator.clipboard.writeText(`![${file.original_name}](${fullUrl})`);
      alert('Markdown 图片语法已复制');
    } else {
      navigator.clipboard.writeText(`[${file.original_name}](${fullUrl})`);
      alert('文件链接已复制');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const tree = buildTree();

  const renderTreeNode = (node: TreeNode, level: number = 0): JSX.Element => {
    const isExpanded = expandedFolders.has(node.id);
    const isSelected = selectedFolder === node.path;
    const isDragOver = dragOverFolder === node.path;

    return (
      <div key={node.id ?? 'root'} className="select-none">
        <div
          className={`flex items-center gap-1 px-2 py-1.5 cursor-pointer hover:bg-gray-100 rounded-md mx-2 ${
            isSelected ? 'bg-purple-50 text-purple-700' : ''
          } ${isDragOver ? 'bg-blue-50 border-2 border-blue-300 border-dashed' : ''}`}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
          onClick={() => {
            onSelectFolder(node.path);
            if (node.id !== null) toggleFolder(node.id);
          }}
          onContextMenu={(e) => handleContextMenu(e, node.id === null ? 'root' : 'folder', node.id, node.path)}
          onDragOver={(e) => handleDragOver(e, node.path)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => {
            handleDrop(e, node.path);
            handleFileDrop(e, node.path);
          }}
        >
          {node.id !== null && (
            <span className="text-gray-400 w-4 text-center">
              {node.children.length > 0 || node.notes.length > 0 || node.files.length > 0
                ? (isExpanded ? '▼' : '▶')
                : '•'}
            </span>
          )}
          <span className="text-lg">{node.id === null ? '📁' : '📂'}</span>
          <span className="text-sm truncate flex-1">{node.name}</span>
          <span className="text-xs text-gray-400">
            {node.notes.length > 0 && `📝${node.notes.length}`}
            {node.files.length > 0 && ` 📎${node.files.length}`}
          </span>
        </div>

        {isCreatingFolder && creatingFolderParent === node.id && (
          <div
            className="flex items-center gap-1 px-2 py-1.5 mx-2"
            style={{ paddingLeft: `${(level + 1) * 12 + 8}px` }}
          >
            <span className="text-gray-400">▶</span>
            <span className="text-lg">📂</span>
            <input
              ref={inputRef}
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitCreateFolder();
                if (e.key === 'Escape') {
                  setIsCreatingFolder(false);
                  setNewFolderName('');
                }
              }}
              onBlur={submitCreateFolder}
              className="text-sm border border-purple-300 rounded px-2 py-0.5 w-32 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="文件夹名"
            />
          </div>
        )}

        {isExpanded && node.children.map(child => renderTreeNode(child, level + 1))}

        {isExpanded && node.notes.map(note => (
          <div
            key={note.id}
            draggable
            onDragStart={(e) => handleDragStart(e, note.id)}
            className={`flex items-center gap-1 px-2 py-1.5 cursor-pointer hover:bg-gray-100 rounded-md mx-2 ${
              selectedNoteId === note.id ? 'bg-purple-100 text-purple-800 font-medium' : ''
            }`}
            style={{ paddingLeft: `${(level + 1) * 12 + 8}px` }}
            onClick={(e) => {
              e.stopPropagation();
              onSelectNote(note);
            }}
            onContextMenu={(e) => {
              e.stopPropagation();
              handleContextMenu(e, 'note', note.id);
            }}
          >
            <span className="text-gray-400 w-4"></span>
            <span className="text-base">📝</span>
            <span className="text-sm truncate">{note.title}</span>
          </div>
        ))}

        {isExpanded && node.files.map(file => (
          <div
            key={file.id}
            className={`flex items-center gap-1 px-2 py-1.5 cursor-pointer hover:bg-gray-100 rounded-md mx-2 group ${
              selectedFileId === file.id ? 'bg-purple-100 text-purple-800' : ''
            }`}
            style={{ paddingLeft: `${(level + 1) * 12 + 8}px` }}
            onClick={(e) => {
              e.stopPropagation();
              onSelectFile(file);
            }}
            onContextMenu={(e) => {
              e.stopPropagation();
              handleContextMenu(e, 'file', file.id);
            }}
          >
            <span className="text-gray-400 w-4"></span>
            <span className="text-base">
              {file.mime_type.startsWith('image/') ? '🖼️' :
                file.mime_type.includes('pdf') ? '📄' :
                  file.mime_type.includes('word') ? '📝' :
                    file.mime_type.includes('sheet') ? '📊' : '📎'}
            </span>
            <span className="text-sm truncate flex-1">{file.original_name}</span>
            <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
              {formatFileSize(file.size)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto"
      onContextMenu={(e) => {
        if ((e.target as HTMLElement).closest('.folder-tree-item') === null) {
          handleContextMenu(e, 'root', null);
        }
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-gray-700">文件夹</span>
          <button
            onClick={() => {
              setCreatingFolderParent(null);
              setIsCreatingFolder(true);
            }}
            className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200"
          >
            + 新建
          </button>
        </div>
        {isCreatingFolder && creatingFolderParent === null && (
          <div className="flex items-center gap-2">
            <span className="text-lg">📂</span>
            <input
              ref={inputRef}
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitCreateFolder();
                if (e.key === 'Escape') {
                  setIsCreatingFolder(false);
                  setNewFolderName('');
                }
              }}
              onBlur={submitCreateFolder}
              className="text-sm border border-purple-300 rounded px-2 py-1 flex-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="文件夹名称"
            />
          </div>
        )}
      </div>

      <div className="py-2">
        {renderTreeNode(tree)}
      </div>

      {contextMenu.visible && (
        <div
          ref={contextMenuRef}
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[140px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {(contextMenu.type === 'folder' || contextMenu.type === 'root') && (
            <>
              <button
                onClick={handleCreateFolder}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
              >
                <span>📂</span> 新建文件夹
              </button>
              <button
                onClick={handleCreateNote}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
              >
                <span>📝</span> 新建笔记
              </button>
              <button
                onClick={handleUploadClick}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
              >
                <span>📎</span> 上传文件
              </button>
            </>
          )}
          {contextMenu.type === 'folder' && contextMenu.targetId !== null && (
            <>
              <hr className="my-1 border-gray-100" />
              <button
                onClick={handleDownloadFolder}
                className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-blue-600 flex items-center gap-2"
              >
                <span>📦</span> 下载全部
              </button>
              <button
                onClick={handleDelete}
                className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
              >
                <span>🗑️</span> 删除
              </button>
            </>
          )}
          {contextMenu.type === 'note' && (
            <button
              onClick={handleDelete}
              className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
            >
              <span>🗑️</span> 删除笔记
            </button>
          )}
          {contextMenu.type === 'file' && (
            <>
              <button
                onClick={async () => {
                  const file = files.find(f => f.id === contextMenu.targetId);
                  if (file) {
                    try {
                      const response = await fetch(file.path);
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = file.original_name;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      window.URL.revokeObjectURL(url);
                    } catch (error) {
                      alert('下载失败');
                    }
                  }
                  setContextMenu(prev => ({ ...prev, visible: false }));
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
              >
                <span>⬇️</span> 下载文件
              </button>
              <button
                onClick={() => {
                  const file = files.find(f => f.id === contextMenu.targetId);
                  if (file) copyFileMarkdown(file);
                  setContextMenu(prev => ({ ...prev, visible: false }));
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
              >
                <span>🔗</span> 复制链接
              </button>
              <button
                onClick={handleDelete}
                className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
              >
                <span>🗑️</span> 删除文件
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
