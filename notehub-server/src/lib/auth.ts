import { cookies } from 'next/headers';
import { getSessionById, getUserById, User } from './db';

const DEVELOPER_USERNAMES = ['demo'];

export function isDeveloper(username: string): boolean {
  return DEVELOPER_USERNAMES.includes(username);
}

export function getCurrentUser(): User | null {
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

export function requireAuth(): User {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export function requireDeveloper(): User {
  const user = requireAuth();
  if (!isDeveloper(user.username)) {
    throw new Error('Forbidden');
  }
  return user;
}
