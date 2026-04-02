import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
  }

  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('email_verification_token', token)
    .single();

  if (!user) {
    return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
  }

  await supabase
    .from('users')
    .update({ email_verified: 1, email_verification_token: null })
    .eq('id', user.id);

  return NextResponse.redirect(new URL('/login?verified=1', request.url));
}
