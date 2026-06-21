import { cookies } from 'next/headers';
import { getSessionById, getUserById, User } from './db';

export function getCurrentUser(): User | null {
  const cookieStore = cookies();
  const sessionId = cookieStore.get('session_id')?.value;

  if (!sessionId) {
    return null;
  }

  const session = getSessionById(sessionId);
  if (!session) {
    // Session 过期，不在这里清除 cookie（只能在 Server Action 或 Route Handler 中清除）
    return null;
  }

  const user = getUserById(session.user_id);
  return user || null;
}

export function requireAuth(): User {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}
