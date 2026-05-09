import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getOAuthClient } from '@/lib/google';
import { supabaseAdmin } from '@/lib/supabase';
import { setSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      process.env.NEXT_PUBLIC_APP_URL + '/?error=access_denied'
    );
  }

  if (!code) {
    return NextResponse.redirect(
      process.env.NEXT_PUBLIC_APP_URL + '/?error=no_code'
    );
  }

  try {
    const oauth2Client = getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: profile } = await oauth2.userinfo.get();

    if (!profile.email) {
      throw new Error('No email returned from Google');
    }

    const { data: user, error: upsertError } = await supabaseAdmin
      .from('users')
      .upsert(
        {
          email: profile.email,
          name: profile.name,
          picture: profile.picture,
          google_access_token: tokens.access_token,
          google_refresh_token: tokens.refresh_token,
          google_token_expires_at: tokens.expiry_date
            ? new Date(tokens.expiry_date).toISOString()
            : null,
          last_sign_in_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      )
      .select()
      .single();

    if (upsertError || !user) {
      console.error('Supabase upsert error:', upsertError);
      throw new Error('Failed to save user');
    }

    await setSession({
      userId: user.id,
      email: user.email,
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30,
    });

    return NextResponse.redirect(
      process.env.NEXT_PUBLIC_APP_URL + '/dashboard'
    );
  } catch (err) {
    console.error('OAuth callback error:', err);
    return NextResponse.redirect(
      process.env.NEXT_PUBLIC_APP_URL + '/?error=auth_failed'
    );
  }
}
