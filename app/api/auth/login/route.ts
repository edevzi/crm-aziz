import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, sessions } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { generateSessionId } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    const userResult = await db
      .select()
      .from(users)
      .where(and(eq(users.username, username), eq(users.password, password)));

    if (userResult.length === 1) {
      const user = userResult[0];
      const sessionId = generateSessionId();

      // Expire in 10 years
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 10);

      await db.insert(sessions).values({
        id: sessionId,
        userId: user.id,
        expiresAt,
      });

      const response = NextResponse.json({ success: true, role: user.role });
      response.cookies.set('auth-session', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 365 * 10, // 10 years
      });
      return response;
    }

    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
