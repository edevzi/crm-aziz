import { cookies } from 'next/headers';
import { db } from './db';
import { users, sessions } from './schema';
import { eq } from 'drizzle-orm';

export async function getCurrentUser() {
  const cookieStore = cookies();
  const sessionId = cookieStore.get('auth-session')?.value;

  if (!sessionId) {
    return null;
  }

  // Find the session and user
  const sessionResult = await db
    .select({
      user: users,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, sessionId));

  if (sessionResult.length === 0) {
    return null;
  }

  const { user } = sessionResult[0];
  
  // Optionally check expiration
  // const session = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
  // if (session[0].expiresAt < new Date()) { ... }

  return user;
}

export function generateSessionId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
