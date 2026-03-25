'use server';

import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/db';
import { setSession, clearSession } from '@/lib/session';

export async function login(formData: FormData) {
  const username = String(formData.get('username') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!username || !password) return { error: 'Please enter your username and password' };

  const { data: user } = await supabase
    .from('users')
    .select('id, username, password_hash, is_admin')
    .eq('username', username)
    .single();

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return { error: 'Invalid username or password' };
  }

  await setSession({ userId: user.id, username: user.username, isAdmin: user.is_admin === 1 });
  redirect('/');
}

export async function register(formData: FormData) {
  const username = String(formData.get('username') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (username.length < 2) return { error: 'Username must be at least 2 characters' };
  if (password.length < 4) return { error: 'Password must be at least 4 characters' };

  const { data: exists } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .single();
  if (exists) return { error: 'That username is already taken' };

  const hash = bcrypt.hashSync(password, 10);
  const id = crypto.randomUUID();

  const { error } = await supabase.from('users').insert({
    id,
    username,
    password_hash: hash,
    balance: 50000,
    is_admin: 0,
    created_at: new Date().toISOString(),
  });

  if (error) return { error: 'Registration failed' };

  await setSession({ userId: id, username, isAdmin: false });
  redirect('/');
}

export async function logout() {
  await clearSession();
  redirect('/login');
}
