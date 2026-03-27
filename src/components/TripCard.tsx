'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { TripRow } from '@/lib/db';

const TRANSPORT_LABELS: Record<string, string> = {
  flight: '飛行機',
  train: '電車・新幹線',
  car: '車',
  taxi: 'タクシー',
  undecided: '未定',
};

interface Props {
  trip: TripRow;
}

export default function TripCard({ trip }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const daysLabel = trip.days === 1 ? '日帰り' : `${trip.days - 1}泊${trip.days}日`;

  async function handleDelete() {
    setDeleting(true);
    await fetch(`/api/trips/${trip.id}`, { method: 'DELETE' });
    router.refresh();
  }

  return (
    <div className="relative bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
      <Link href={`/trips/${trip.id}/plans`} className="block">
        <div className="flex items-start justify-between pr-8">
          <div>
            <p className="font-bold text-gray-800">
              {trip.origin} → {trip.destination}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              {daysLabel} / {TRANSPORT_LABELS[trip.main_transport] ?? trip.main_transport}
            </p>
            {trip.optional_note && (
              <p className="text-xs text-gray-400 mt-1 truncate max-w-xs">
                {trip.optional_note}
              </p>
            )}
          </div>
          <span className="text-gray-400 text-sm">→</span>
        </div>
      </Link>

      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className="absolute top-3 right-10 text-gray-300 hover:text-red-400 transition-colors text-lg leading-none"
          aria-label="削除"
        >
          ×
        </button>
      ) : (
        <div className="mt-3 flex items-center gap-2 text-sm">
          <span className="text-gray-500">削除しますか？</span>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
          >
            {deleting ? '削除中...' : '削除'}
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="text-gray-400 hover:text-gray-600 px-2 py-1"
          >
            キャンセル
          </button>
        </div>
      )}
    </div>
  );
}
