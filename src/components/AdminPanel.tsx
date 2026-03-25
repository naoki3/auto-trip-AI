'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { MatchRow } from '@/lib/db';
import { syncMatches } from '@/app/actions/admin';

interface Props {
  matches: MatchRow[];
}

export default function AdminPanel({ matches }: Props) {
  const [isPending, startTransition] = useTransition();
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const router = useRouter();

  function handleSync() {
    setSyncMsg(null);
    startTransition(async () => {
      const r = await syncMatches();
      if (r.error) {
        setSyncMsg(`Error: ${r.error}`);
      } else {
        setSyncMsg(`Sync complete: +${r.added} added, ${r.updated} updated`);
        router.refresh();
      }
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
        <button
          onClick={handleSync}
          disabled={isPending}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? 'Syncing...' : 'Sync Match Data'}
        </button>
      </div>

      {syncMsg && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-700">
          {syncMsg}
        </div>
      )}

      <section>
        <h2 className="text-sm font-semibold text-gray-600 mb-3">Matches ({matches.length})</h2>
        <div className="space-y-2">
          {matches.map((m) => (
            <div key={m.id} className="bg-white rounded-lg border border-gray-100 p-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-800">
                  {m.home_team} vs {m.away_team}
                </span>
                <span className="text-xs text-gray-400">{m.status}</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{m.league}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
