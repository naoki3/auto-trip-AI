import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/db';
import { setSession } from '@/lib/session';

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  name: string;
  picture: string;
}

export async function GET(request: NextRequest) {
  const jar = await cookies();
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const storedState = jar.get('oauth_state')?.value;

  jar.delete('oauth_state');

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL('/login?error=oauth_not_configured', request.url));
  }

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL('/login?error=token_exchange_failed', request.url));
  }

  const tokens: GoogleTokenResponse = await tokenRes.json();

  // Get user info from Google
  const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userInfoRes.ok) {
    return NextResponse.redirect(new URL('/login?error=userinfo_failed', request.url));
  }

  const googleUser: GoogleUserInfo = await userInfoRes.json();

  // Find or create user
  const { data: existingUser } = await supabase
    .from('users')
    .select('id, username, is_admin')
    .eq('google_id', googleUser.sub)
    .single();

  if (existingUser) {
    await setSession({
      userId: existingUser.id,
      username: existingUser.username,
      isAdmin: existingUser.is_admin === 1,
    });
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Check if email already exists (link accounts)
  const { data: emailUser } = await supabase
    .from('users')
    .select('id, username, is_admin')
    .eq('email', googleUser.email)
    .single();

  if (emailUser) {
    // Link Google account to existing user
    await supabase
      .from('users')
      .update({ google_id: googleUser.sub })
      .eq('id', emailUser.id);

    await setSession({
      userId: emailUser.id,
      username: emailUser.username,
      isAdmin: emailUser.is_admin === 1,
    });
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Create new user
  const id = crypto.randomUUID();
  // Generate a unique username from the Google display name
  const baseName = googleUser.name.replace(/\s+/g, '_').slice(0, 20);
  const username = `${baseName}_${id.slice(0, 6)}`;

  const { error } = await supabase.from('users').insert({
    id,
    username,
    password_hash: null,
    email: googleUser.email,
    google_id: googleUser.sub,
    is_admin: 0,
    subscription_status: 'free',
    created_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.redirect(new URL('/login?error=register_failed', request.url));
  }

  await setSession({ userId: id, username, isAdmin: false });
  return NextResponse.redirect(new URL('/', request.url));
}
