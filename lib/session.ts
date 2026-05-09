import { cookies } from 'next/headers';
import crypto from 'crypto';

const SESSION_COOKIE_NAME = 'sava_session';
const SESSION_SECRET = process.env.SESSION_SECRET!;

export type Session = {
  userId: string;
  email: string;
  expiresAt: number;
};

function sign(payload: string): string {
  return crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('hex');
}

export function encodeSession(session: Session): string {
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url');
  const signature = sign(payload);
  return payload + '.' + signature;
}

export function decodeSession(token: string): Session | null {
  try {
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return null;
    if (sign(payload) !== signature) return null;

    const session: Session = JSON.parse(
      Buffer.from(payload, 'base64url').toString()
    );
    if (session.expiresAt < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

export async function setSession(session: Session) {
  const token = encodeSession(session);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return decodeSession(token);
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
