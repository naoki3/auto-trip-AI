import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/db';

let initialized = false;

export async function initAdmin(): Promise<void> {
  if (initialized) return;
  initialized = true;

  const username = process.env.INIT_ADMIN_USERNAME?.trim();
  const password = process.env.INIT_ADMIN_PASSWORD;

  if (!username || !password) {
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        '[init-admin] INIT_ADMIN_USERNAME / INIT_ADMIN_PASSWORD not set. ' +
          'No admin account will be created automatically.'
      );
    }
    return;
  }

  if (password.length < 12) {
    console.error('[init-admin] INIT_ADMIN_PASSWORD must be at least 12 characters. Skipping.');
    return;
  }

  // Only create if no admin exists yet
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('is_admin', 1)
    .limit(1)
    .single();

  if (existing) return;

  const email = process.env.INIT_ADMIN_EMAIL?.trim() || null;
  const hash = bcrypt.hashSync(password, 12);

  const { error } = await supabase.from('users').insert({
    id: crypto.randomUUID(),
    username,
    email,
    password_hash: hash,
    email_verified: 1,
    email_verification_token: null,
    is_admin: 1,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error('[init-admin] Failed to create admin user:', error.message);
  } else {
    console.log(`[init-admin] Admin user "${username}" created.`);
  }
}
