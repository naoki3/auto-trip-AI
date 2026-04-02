import { supabase } from '@/lib/db';

export const LIMITS = {
  free: 3,
  pro: 50,
} as const;

export async function checkTripLimit(userId: string): Promise<{ allowed: boolean; message?: string }> {
  const { data: user } = await supabase
    .from('users')
    .select('subscription_status')
    .eq('id', userId)
    .single();

  const isPro = user?.subscription_status === 'active';
  const limit = isPro ? LIMITS.pro : LIMITS.free;

  // Count trips created this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from('trips')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString());

  const current = count ?? 0;

  if (current >= limit) {
    if (isPro) {
      return { allowed: false, message: `今月の旅行作成上限（${limit}件）に達しました。来月になるとリセットされます` };
    }
    return { allowed: false, message: `無料プランの今月の上限（${limit}件）に達しました。Pro プランにアップグレードすると月${LIMITS.pro}件まで作成できます` };
  }

  return { allowed: true };
}
