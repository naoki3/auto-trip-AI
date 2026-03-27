import { redirect, notFound } from 'next/navigation';

import Link from 'next/link';
import { getSession } from '@/lib/session';
import { getLang } from '@/lib/lang';
import { supabase } from '@/lib/db';
import Header from '@/components/Header';
import PlansLoader from '@/components/PlansLoader';
import { t } from '@/lib/i18n';

interface Props {
  params: Promise<{ tripId: string }>;
}

export default async function PlansPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { tripId } = await params;
  const lang = await getLang();

  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .eq('user_id', session.userId)
    .single();

  if (!trip) notFound();

  const { data: existingPlans } = await supabase
    .from('plans')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true });

  const daysLabel = trip.days === 1 ? '日帰り' : `${trip.days - 1}泊${trip.days}日`;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header username={session.username} isAdmin={session.isAdmin} lang={lang} />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-1">
          <Link href="/" className="text-xs text-blue-600 hover:underline">{t('plansPage', 'backToList', lang)}</Link>
        </div>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            {trip.origin} → {trip.destination}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">{daysLabel}{t('plansPage', 'planComparison', lang)}</p>
        </div>
        <PlansLoader tripId={tripId} initialPlans={existingPlans ?? []} lang={lang} />
      </main>
    </div>
  );
}
