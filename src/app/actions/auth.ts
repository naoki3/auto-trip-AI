'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/db';
import { setSession, clearSession } from '@/lib/session';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit';

export async function login(formData: FormData) {
  const username = String(formData.get('username') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!username || !password) return { error: 'ユーザー名とパスワードを入力してください' };

  // Rate limit by IP
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  const rateLimitKey = `login:${ip}`;
  const { allowed, retryAfterSeconds } = checkRateLimit(rateLimitKey);
  if (!allowed) {
    const minutes = Math.ceil(retryAfterSeconds / 60);
    return { error: `ログイン試行回数が上限に達しました。${minutes}分後に再試行してください` };
  }

  const { data: user } = await supabase
    .from('users')
    .select('id, username, password_hash, is_admin')
    .eq('username', username)
    .single();

  // password_hash が null の場合は Google アカウントのユーザー
  if (!user || !user.password_hash || !bcrypt.compareSync(password, user.password_hash)) {
    return { error: 'ユーザー名またはパスワードが正しくありません' };
  }

  resetRateLimit(rateLimitKey);
  await setSession({ userId: user.id, username: user.username, isAdmin: user.is_admin === 1 });
  redirect('/');
}

export async function register(formData: FormData) {
  const username = String(formData.get('username') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (username.length < 2) return { error: 'ユーザー名は2文字以上で入力してください' };
  if (password.length < 8) return { error: 'パスワードは8文字以上で入力してください' };

  const { data: exists } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .single();
  if (exists) return { error: 'このユーザー名はすでに使用されています' };

  const hash = bcrypt.hashSync(password, 10);
  const id = crypto.randomUUID();

  const { error } = await supabase.from('users').insert({
    id,
    username,
    password_hash: hash,
    is_admin: 0,
    created_at: new Date().toISOString(),
  });

  if (error) return { error: '登録に失敗しました。しばらくしてから再試行してください' };

  await setSession({ userId: id, username, isAdmin: false });
  redirect('/');
}

export async function logout() {
  await clearSession();
  redirect('/login');
}
