'use client';

import { useEffect, useRef, useState } from 'react';
import PlanCard from './PlanCard';
import type { PlanRow } from '@/lib/db';
import { t, type Lang } from '@/lib/i18n';

const PLAN_ORDER = ['fastest', 'cheapest', 'relaxed', 'sightseeing'];

interface Props {
  tripId: string;
  initialPlans: PlanRow[];
  lang: Lang;
}

export default function PlansLoader({ tripId, initialPlans, lang }: Props) {
  const [plans, setPlans] = useState<PlanRow[]>(initialPlans);
  const [error, setError] = useState(false);
  const generatingRef = useRef(false);

  useEffect(() => {
    if (initialPlans.length >= 4) return;

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
          if (existing.length >= 4) return;
        }

        if (!generatingRef.current) {
          generatingRef.current = true;
          generate().catch(() => {
            if (!stopped) setError(true);
          });
        }

        const interval = setInterval(async () => {
          if (stopped) { clearInterval(interval); return; }
          try {
            const data = await fetchPlans();
            if (data.length > 0 && !stopped) setPlans(data);
            if (data.length >= 4) clearInterval(interval);
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
  }, [tripId, initialPlans.length]);

  if (error) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border text-gray-500">
        <p className="text-3xl mb-3">⚠️</p>
        <p className="font-medium">{t('plansLoader', 'error', lang)}</p>
        <p className="text-sm mt-1">{t('plansLoader', 'errorDesc', lang)}</p>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border">
        <div className="flex justify-center mb-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="font-medium text-gray-700">{t('plansLoader', 'generating', lang)}</p>
        <p className="text-sm mt-1 text-gray-400">{t('plansLoader', 'generatingDesc', lang)}</p>
      </div>
    );
  }

  const sorted = [...plans].sort(
    (a, b) => PLAN_ORDER.indexOf(a.plan_type) - PLAN_ORDER.indexOf(b.plan_type)
  );

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sorted.map((plan) => (
          <PlanCard key={plan.id} plan={plan} tripId={tripId} lang={lang} />
        ))}
      </div>
      {plans.length < 4 && (
        <p className="text-center text-sm text-gray-400 mt-4 flex items-center justify-center gap-2">
          <span className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin inline-block" />
          {t('plansLoader', 'loadingRemaining', lang)}
        </p>
      )}
    </div>
  );
}
