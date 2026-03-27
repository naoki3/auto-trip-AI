import { Suspense } from 'react';
import { redirect } from 'next/navigation';

import { getSession } from '@/lib/session';
import { getLang } from '@/lib/lang';
import Header from '@/components/Header';
import TripForm from '@/components/TripForm';
import { t } from '@/lib/i18n';

export default async function NewTripPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  const lang = await getLang();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header username={session.username} isAdmin={session.isAdmin} lang={lang} />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800">{t('newTrip', 'title', lang)}</h2>
          <p className="text-sm text-gray-500 mt-1">{t('newTrip', 'desc', lang)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <Suspense>
            <TripForm lang={lang} />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
