'use client';

import { useEffect, useRef, useState } from 'react';
import PlanCard from './PlanCard';
import type { PlanRow } from '@/lib/db';

const PLAN_ORDER = ['fastest', 'cheapest', 'relaxed', 'sightseeing'];

interface Props {
  tripId: string;
}

export default function PlansLoader({ tripId }: Props) {
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [error, setError] = useState(false);
  const generatingRef = useRef(false);

  useEffect(() => {
    let stopped = false;

    async function fetchPlans(): Promise<PlanRow[]> {
      const res = await fetch(`/api/trips/${tripId}/plans`);
      if (!res.ok) throw new Error('fetch failed');
      return res.json();
    }

    async function generate() {
      const res = await fetch(`/api/trips/${tripId}/generate-plans`, { method: 'POST' });
      if (!res.ok) throw new Error('generate failed');
    }

    async function poll() {
      try {
        const existing = await fetchPlans();
        if (stopped) return;
        if (existing.length > 0) {
          setPlans(existing);
          return;
        }

        // No plans yet — kick off generation (once)
        if (!generatingRef.current) {
          generatingRef.current = true;
          generate().catch(() => {
            if (!stopped) setError(true);
          });
        }

        // Poll every 4 seconds until plans appear
        const interval = setInterval(async () => {
          if (stopped) { clearInterval(interval); return; }
          try {
            const data = await fetchPlans();
            if (data.length > 0) {
              clearInterval(interval);
              if (!stopped) setPlans(data);
            }
          } catch {
            clearInterval(interval);
            if (!stopped) setError(true);
          }
        }, 4000);
      } catch {
        if (!stopped) setError(true);
      }
    }

    poll();
    return () => { stopped = true; };
  }, [tripId]);

  if (error) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border text-gray-500">
        <p className="text-3xl mb-3">⚠️</p>
        <p className="font-medium">プランの生成に失敗しました</p>
        <p className="text-sm mt-1">ページを再読み込みして再試行してください</p>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border">
        <div className="flex justify-center mb-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="font-medium text-gray-700">AIがプランを生成中...</p>
        <p className="text-sm mt-1 text-gray-400">4種類のプランを考えています（30〜60秒）</p>
      </div>
    );
  }

  const sorted = [...plans].sort(
    (a, b) => PLAN_ORDER.indexOf(a.plan_type) - PLAN_ORDER.indexOf(b.plan_type)
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {sorted.map((plan) => (
        <PlanCard key={plan.id} plan={plan} tripId={tripId} />
      ))}
    </div>
  );
}
