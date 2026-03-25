import { Suspense } from 'react';
import { redirect } from 'next/navigation';

import { getSession } from '@/lib/session';
import Header from '@/components/Header';
import TripForm from '@/components/TripForm';

export default async function NewTripPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header username={session.username} isAdmin={session.isAdmin} />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800">旅行プランを作成</h2>
          <p className="text-sm text-gray-500 mt-1">
            条件を入力するとAIが4種類のプランを提案します
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <Suspense>
            <TripForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
