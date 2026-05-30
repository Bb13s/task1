import { redirect } from 'next/navigation';
import { getAllFolders, getAllNotes, seedData, getNoteById, getFilesByUploader } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import WorkspaceClient from './WorkspaceClient';

interface WorkspacePageProps {
  searchParams: { note?: string };
}

export default function WorkspacePage({ searchParams }: WorkspacePageProps) {
  // 获取当前用户
  const user = getCurrentUser();

  // 未登录，重定向到登录页
  if (!user) {
    redirect('/login');
  }

  // 确保种子数据已插入
  seedData();

  const folders = getAllFolders(user.username);
  const notes = getAllNotes(user.username);
  const files = getFilesByUploader(user.username);

  // 如果有 note 参数，获取对应笔记
  const initialNoteId = searchParams.note ? parseInt(searchParams.note) : null;
  const initialNote = initialNoteId ? getNoteById(initialNoteId, user.username) : null;

  return (
    <WorkspaceClient
      initialFolders={folders}
      initialNotes={notes}
      initialFiles={files}
      initialSelectedNote={initialNote}
      currentUser={user}
    />
  );
}
