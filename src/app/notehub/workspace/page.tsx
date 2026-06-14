import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getAllFolders, getAllNotes, seedData, getNoteById, getFilesByUploader, getSessionById, getUserById } from '@/lib/db';
import WorkspaceClient from './WorkspaceClient';

export const dynamic = 'force-dynamic';

interface WorkspacePageProps {
  searchParams: { note?: string };
}

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

export default function WorkspacePage({ searchParams }: WorkspacePageProps) {
  // 获取当前用户
  const user = getCurrentUserFromCookies();

  // 未登录，重定向到登录页
  if (!user) {
    redirect('/notehub/login');
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
