import { NextResponse } from 'next/server';
import { getOAuthClient, GOOGLE_SCOPES } from '@/lib/google';

export async function GET() {
  const oauth2Client = getOAuthClient();

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: GOOGLE_SCOPES,
  });

  return NextResponse.redirect(url);
}
