'use client';

import { useState, useEffect, useMemo, useCallback, Fragment } from 'react';
import Link from 'next/link';
import FolderTree from './FolderTree';
import MarkdownPreview from './MarkdownPreview';
import SimpleEditor from './SimpleEditor';
import FilePreview from './FilePreview';
import { Note, FileRecord, User } from '@/lib/db';
import JSZip from 'jszip';

interface Folder {
  id: number;
  name: string;
  parent_id: number | null;
  author: string;
  created_at: string;
}

interface WorkspaceClientProps {
  initialFolders: Folder[];
  initialNotes: Note[];
  initialFiles: FileRecord[];
  initialSelectedNote?: Note | null;
  currentUser: User;
}

export default function WorkspaceClient({ initialFolders, initialNotes, initialFiles, initialSelectedNote, currentUser }: WorkspaceClientProps) {
  const [folders, setFolders] = useState<Folder[]>(initialFolders);
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [files, setFiles] = useState<FileRecord[]>(initialFiles);
  const [selectedFolder, setSelectedFolder] = useState(initialSelectedNote?.folder_path || '/');

  // 当前编辑的笔记
  const [editingNote, setEditingNote] = useState<Note | null>(initialSelectedNote || null);
  const [editorContent, setEditorContent] = useState(initialSelectedNote?.content || '');
  const [editorTitle, setEditorTitle] = useState(initialSelectedNote?.title || '');

  // 右侧预览状态
  const [previewMode, setPreviewMode] = useState<'none' | 'note' | 'file'>('none');
  const [previewFile, setPreviewFile] = useState<FileRecord | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  const noteTitles = useMemo(() => notes.map(n => n.title), [notes]);

  const refreshFiles = useCallback(async () => {
    try {
      const res = await fetch(`/api/files?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      const data = await res.json();
      if (data.files) {
        setFiles(data.files);
      }
    } catch (error) {
      console.error('Failed to refresh files:', error);
    }
  }, []);

  // 页面重新获得焦点时刷新文件列表（确保状态同步）
  useEffect(() => {
    const handleFocus = () => {
      refreshFiles();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshFiles]);

  // 选中笔记（进入编辑模式）
  const handleSelectNote = useCallback((note: Note) => {
    const latestNote = notes.find(n => n.id === note.id);
    const noteToUse = latestNote || note;
    setEditingNote(noteToUse);
    setEditorTitle(noteToUse.title);
    setEditorContent(noteToUse.content || '');
    setSaveStatus('saved');
    // 切换笔记时，如果预览开启，继续预览当前笔记
    if (showPreview) {
      setPreviewMode('note');
      setPreviewFile(null);
    } else {
      setPreviewMode('none');
    }
  }, [notes, showPreview]);

  // 选中PDF文件（右侧预览，中间不编辑）
  const handleSelectFile = useCallback((file: FileRecord) => {
    setPreviewFile(file);
    setPreviewMode('file');
    // 点击PDF时不改变当前编辑的笔记
  }, []);

  const handleCreateNote = useCallback(async (folderPath: string) => {
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '新笔记',
        content: '',
        folderPath,
        author: currentUser.username,
      }),
    });
    const data = await res.json();
    if (data.note) {
      setNotes(prev => [data.note, ...prev]);
      handleSelectNote(data.note);
    }
  }, [currentUser, handleSelectNote]);

  const handleCreateFolder = useCallback(async (name: string, parentId: number | null) => {
    const res = await fetch('/api/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, parentId, author: currentUser.username }),
    });
    const data = await res.json();
    if (data.folder) {
      setFolders(prev => [...prev, data.folder]);
    }
  }, [currentUser]);

  const handleDeleteFolder = useCallback(async (id: number) => {
    const res = await fetch(`/api/folders/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setFolders(prev => prev.filter(f => f.id !== id));
      const notesRes = await fetch('/api/notes');
      const notesData = await notesRes.json();
      setNotes(notesData.notes || []);
    }
  }, []);

  const handleDeleteNote = useCallback(async (id: number) => {
    const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setNotes(prev => prev.filter(n => n.id !== id));
      if (editingNote?.id === id) {
        setEditingNote(null);
        setEditorTitle('');
        setEditorContent('');
        setPreviewMode('none');
      }
    }
  }, [editingNote]);

  const handleMoveNote = useCallback(async (noteId: number, folderPath: string) => {
    const res = await fetch(`/api/notes/${noteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder_path: folderPath }),
    });
    if (res.ok) {
      setNotes(prev => prev.map(n => n.id === noteId ? { ...n, folder_path: folderPath } : n));
    }
  }, []);

  // 保存笔记
  const saveNote = useCallback(async (noteId: number, title: string, content: string) => {
    try {
      setSaveStatus('saving');
      const res = await fetch(`/api/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });

      if (res.ok) {
        setNotes(prev => prev.map(n =>
          n.id === noteId ? { ...n, title, content } : n
        ));
        setSaveStatus('saved');
        return true;
      }
      setSaveStatus('unsaved');
      return false;
    } catch (error) {
      console.error('Save error:', error);
      setSaveStatus('unsaved');
      return false;
    }
  }, []);

  // 处理编辑器内容变化
  const handleEditorChange = useCallback((newContent: string) => {
    setEditorContent(newContent);
    if (editingNote) {
      setSaveStatus('unsaved');
    }
  }, [editingNote]);

  // 自动保存
  useEffect(() => {
    if (!editingNote) return;
    if (editorTitle === editingNote.title && editorContent === editingNote.content) {
      setSaveStatus('saved');
      return;
    }

    const timeout = setTimeout(() => {
      saveNote(editingNote.id, editorTitle, editorContent);
    }, 1500);

    return () => clearTimeout(timeout);
  }, [editorTitle, editorContent, editingNote, saveNote]);

  // 预览按钮点击
  const handleTogglePreview = useCallback(() => {
    if (!showPreview) {
      // 开启预览
      setShowPreview(true);
      if (editingNote) {
        setPreviewMode('note');
      } else if (previewFile) {
        setPreviewMode('file');
      }
    } else {
      // 关闭预览
      setShowPreview(false);
      setPreviewMode('none');
    }
  }, [showPreview, editingNote, previewFile]);

  // 下载笔记
  const handleDownloadNote = useCallback(() => {
    if (!editingNote) return;
    const content = `# ${editorTitle}\n\n${editorContent}`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${editorTitle || 'untitled'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [editingNote, editorTitle, editorContent]);

  // 公开/取消公开笔记
  const handleTogglePublic = useCallback(async () => {
    if (!editingNote) return;

    const newStatus = editingNote.is_public === 1 ? 0 : 1;
    try {
      const res = await fetch(`/api/notes/${editingNote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_public: newStatus }),
      });

      if (res.ok) {
        // 更新本地状态
        setNotes(prev => prev.map(n =>
          n.id === editingNote.id ? { ...n, is_public: newStatus } : n
        ));
        setEditingNote(prev => prev ? { ...prev, is_public: newStatus } : null);
      } else {
        alert('操作失败');
      }
    } catch (error) {
      alert('网络错误');
    }
  }, [editingNote]);

  // 批量下载文件夹
  const handleDownloadFolder = useCallback(async (folderPath: string) => {
    const folderNotes = notes.filter(n => n.folder_path === folderPath);
    const folderFiles = files.filter(f => f.folder_path === folderPath);

    if (folderNotes.length === 0 && folderFiles.length === 0) {
      alert('该文件夹为空');
      return;
    }

    const zip = new JSZip();
    const folderName = folderPath === '/' ? 'root' : folderPath.split('/').pop() || 'folder';

    folderNotes.forEach(note => {
      const content = `# ${note.title}\n\n${note.content || ''}`;
      zip.file(`${note.title}.md`, content);
    });

    for (const file of folderFiles) {
      try {
        const response = await fetch(file.path);
        const blob = await response.blob();
        zip.file(file.original_name, blob);
      } catch (error) {
        console.error(`Failed to download file ${file.original_name}:`, error);
      }
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${folderName}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [notes, files]);

  // 上传文件
  const handleUploadFile = useCallback(async (folderPath: string, file: File, isPublic?: boolean) => {
    console.log('handleUploadFile called with isPublic:', isPublic);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folderPath', folderPath);
    formData.append('isPublic', isPublic ? '1' : '0');
    console.log('FormData isPublic:', formData.get('isPublic'));

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      console.log('Upload response:', data);
      if (data.success) {
        await refreshFiles();
        alert(`文件 "${file.name}" 上传成功！${isPublic ? '已公开到广场' : '仅自己可见'}`);
      } else {
        alert(`上传失败: ${data.error}`);
      }
    } catch (error) {
      alert('上传出错');
    }
  }, [refreshFiles]);

  // 删除文件
  const handleDeleteFile = useCallback(async (fileId: number) => {
    try {
      const res = await fetch(`/api/files?id=${fileId}`, { method: 'DELETE' });
      if (res.ok) {
        await refreshFiles();
        if (previewFile?.id === fileId) {
          setPreviewFile(null);
          setPreviewMode('none');
        }
      } else {
        alert('删除失败');
      }
    } catch (error) {
      alert('删除出错');
    }
  }, [refreshFiles, previewFile]);

  // 切换文件公开状态
  const handleToggleFilePublic = useCallback(async (fileId: number, isPublic: boolean) => {
    try {
      const res = await fetch(`/api/files?id=${fileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_public: isPublic ? 1 : 0 }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        await refreshFiles();
      } else {
        alert(data.error || '操作失败' + (data.debug ? JSON.stringify(data.debug) : ''));
      }
    } catch (error) {
      alert('操作出错');
    }
  }, [refreshFiles]);

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600"
          >
            {isSidebarCollapsed ? '☰' : '←'}
          </button>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">N</span>
            </div>
            <span className="font-bold text-lg text-gray-800">NoteHub</span>
          </Link>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-gray-600 hover:text-gray-900">首页</Link>
          <Link href="/explore" className="text-gray-600 hover:text-gray-900">广场</Link>
          <Link href="/workspace" className="text-purple-600 font-medium">工作区</Link>
          <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-200">
            <span className="text-gray-700">👤 {currentUser.username}</span>
            <button
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' });
                window.location.href = '/login';
              }}
              className="text-gray-500 hover:text-red-600 transition-colors"
              title="退出登录"
            >
              退出
            </button>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Folder Tree */}
        <div
          className={`border-r border-gray-200 bg-gray-50 transition-all duration-300 ${
            isSidebarCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-72 opacity-100'
          }`}
        >
          <FolderTree
            folders={folders}
            notes={notes}
            files={files}
            selectedFolder={selectedFolder}
            selectedNoteId={editingNote?.id || null}
            selectedFileId={previewFile?.id || null}
            onSelectFolder={setSelectedFolder}
            onSelectNote={handleSelectNote}
            onSelectFile={handleSelectFile}
            onCreateFolder={handleCreateFolder}
            onCreateNote={handleCreateNote}
            onDeleteFolder={handleDeleteFolder}
            onDeleteNote={handleDeleteNote}
            onMoveNote={handleMoveNote}
            onUploadFile={handleUploadFile}
            onDeleteFile={handleDeleteFile}
            onRefreshFiles={refreshFiles}
            onToggleFilePublic={handleToggleFilePublic}
            onDownloadFolder={handleDownloadFolder}
          />
        </div>

        {/* PDF Preview Mode - Takes remaining space */}
        {previewMode === 'file' && previewFile ? (
          <div className="flex-1 bg-white overflow-hidden">
            <FilePreview file={previewFile} />
          </div>
        ) : (
          <>
            {/* Middle Column - Editor */}
            <div className="flex-1 flex flex-col min-w-0">
              {editingNote ? (
                <>
                  <div className="px-4 py-3 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={editorTitle}
                    onChange={(e) => {
                      setEditorTitle(e.target.value);
                      setSaveStatus('unsaved');
                    }}
                    className="flex-1 text-xl font-semibold border-none focus:outline-none focus:ring-0 placeholder-gray-400"
                    placeholder="笔记标题"
                  />
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={handleTogglePublic}
                      className={`px-3 py-1.5 text-sm rounded transition-colors ${
                        editingNote?.is_public === 1
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      title={editingNote?.is_public === 1 ? '点击取消公开' : '点击公开到广场'}
                    >
                      {editingNote?.is_public === 1 ? '🌐 已公开' : '🔒 公开'}
                    </button>
                    <button
                      onClick={handleTogglePreview}
                      className={`px-3 py-1.5 text-sm rounded transition-colors ${
                        showPreview
                          ? 'bg-purple-600 text-white'
                          : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                      }`}
                      title={showPreview ? '关闭预览' : '开启预览'}
                    >
                      👁️ {showPreview ? '预览中' : '预览'}
                    </button>
                    <button
                      onClick={handleDownloadNote}
                      className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                      title="下载为 Markdown 文件"
                    >
                      ⬇️ 下载
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                  <span>📁 {editingNote.folder_path}</span>
                  <span>•</span>
                  <span className={`
                    ${saveStatus === 'saved' ? 'text-green-600' : ''}
                    ${saveStatus === 'saving' ? 'text-yellow-600' : ''}
                    ${saveStatus === 'unsaved' ? 'text-orange-500' : ''}
                  `}>
                    {saveStatus === 'saved' && '✓ 已保存'}
                    {saveStatus === 'saving' && '⏳ 保存中...'}
                    {saveStatus === 'unsaved' && '• 未保存'}
                  </span>
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <SimpleEditor
                  value={editorContent}
                  onChange={handleEditorChange}
                  placeholder="# 开始编写 Markdown..."
                />
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-lg mb-2">选择一个笔记开始编辑</p>
              <p className="text-sm">或右键点击文件夹创建新笔记</p>
            </div>
          )}
        </div>

        {/* Right Column - Markdown Preview Only */}
        {previewMode === 'note' && showPreview && editingNote ? (
          <div className="w-[45%] border-l border-gray-200 bg-white overflow-hidden">
            <div className="h-full overflow-auto">
              <MarkdownPreview content={editorContent} />
            </div>
          </div>
        ) : null}
      </>
        )}
      </div>

      {/* Status Bar */}
      <div className="h-7 bg-gray-100 border-t border-gray-200 flex items-center justify-between px-3 text-xs text-gray-500 shrink-0">
        <div className="flex items-center gap-4">
          <span>{editingNote ? `字数: ${editorContent.length}` : '就绪'}</span>
          {editingNote && (
            <span className={`
              ${saveStatus === 'saved' ? 'text-green-600' : ''}
              ${saveStatus === 'saving' ? 'text-yellow-600' : ''}
              ${saveStatus === 'unsaved' ? 'text-orange-500' : ''}
            `}>
              {saveStatus === 'saved' && '✓ 已保存'}
              {saveStatus === 'saving' && '⏳ 保存中...'}
              {saveStatus === 'unsaved' && '• 未保存'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span>当前文件夹: {selectedFolder}</span>
          <span>用户: {currentUser.username}</span>
        </div>
      </div>
    </div>
  );
}
