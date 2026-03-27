'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { TripRow } from '@/lib/db';
import { t, type Lang } from '@/lib/i18n';

interface Props {
  trip: TripRow;
  lang: Lang;
}

export default function TripCard({ trip, lang }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const daysLabel = trip.days === 1 ? '日帰り' : `${trip.days - 1}泊${trip.days}日`;

  const transportKeyMap: Record<string, 'transportFlight' | 'transportTrain' | 'transportCar' | 'transportTaxi' | 'transportUndecided'> = {
    flight: 'transportFlight',
    train: 'transportTrain',
    car: 'transportCar',
    taxi: 'transportTaxi',
    undecided: 'transportUndecided',
  };
  const transportKey = transportKeyMap[trip.main_transport] ?? 'transportUndecided';
  const transportLabel = t('tripCard', transportKey, lang);

  async function handleDelete() {
    setDeleting(true);
    await fetch(`/api/trips/${trip.id}`, { method: 'DELETE' });
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-4">
        <p className="text-sm text-gray-700 mb-3">
          <span className="font-medium">{trip.origin} → {trip.destination}</span>{t('tripCard', 'deleteConfirmSuffix', lang)}
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-500 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-red-600 disabled:opacity-50 transition-colors"
          >
            {deleting ? t('tripCard', 'deleting', lang) : t('tripCard', 'deleteBtn', lang)}
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="px-4 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {t('tripCard', 'cancelBtn', lang)}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow flex items-center gap-3">
      <Link href={`/trips/${trip.id}/plans`} className="flex-1 min-w-0">
        <p className="font-bold text-gray-800">
          {trip.origin} → {trip.destination}
        </p>
        <p className="text-sm text-gray-500 mt-0.5">
          {daysLabel} / {transportLabel}
        </p>
        {trip.optional_note && (
          <p className="text-xs text-gray-400 mt-1 truncate">
            {trip.optional_note}
          </p>
        )}
      </Link>
      <button
        onClick={() => setConfirming(true)}
        className="shrink-0 text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
        aria-label="削除"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14H6L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4h6v2" />
        </svg>
      </button>
    </div>
  );
}
