import Link from 'next/link';
import type { PlanRow } from '@/lib/db';
import { t, type Lang } from '@/lib/i18n';

const PLAN_TYPE_CONFIG: Record<string, { icon: string; color: string; labelKey: 'fastestLabel' | 'cheapestLabel' | 'relaxedLabel' | 'sightseeingLabel' }> = {
  fastest: { icon: '⚡', color: 'bg-yellow-50 border-yellow-300 text-yellow-800', labelKey: 'fastestLabel' },
  cheapest: { icon: '💴', color: 'bg-green-50 border-green-300 text-green-800', labelKey: 'cheapestLabel' },
  relaxed: { icon: '🧳', color: 'bg-blue-50 border-blue-300 text-blue-800', labelKey: 'relaxedLabel' },
  sightseeing: { icon: '🗺️', color: 'bg-purple-50 border-purple-300 text-purple-800', labelKey: 'sightseeingLabel' },
};

interface Props {
  plan: PlanRow;
  tripId: string;
  lang: Lang;
}

export default function PlanCard({ plan, tripId, lang }: Props) {
  const meta = PLAN_TYPE_CONFIG[plan.plan_type] ?? {
    icon: '📋',
    color: 'bg-gray-50 border-gray-300 text-gray-800',
    labelKey: 'fastestLabel',
  };

  return (
    <div className={`border-2 rounded-xl p-4 ${meta.color}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{meta.icon}</span>
        <span className="font-bold text-base">{t('planCard', meta.labelKey, lang)}</span>
      </div>

      {plan.summary && (
        <p className="text-sm mb-3 opacity-80">{plan.summary}</p>
      )}

      <div className="flex flex-wrap gap-3 text-xs mb-4">
        {plan.estimated_cost != null && (
          <span className="bg-white/60 rounded-full px-2 py-0.5">
            💰 約 ¥{plan.estimated_cost.toLocaleString()}
          </span>
        )}
        {plan.transfer_count != null && (
          <span className="bg-white/60 rounded-full px-2 py-0.5">
            🔁 乗換 {plan.transfer_count}回
          </span>
        )}
        {plan.walking_score != null && (
          <span className="bg-white/60 rounded-full px-2 py-0.5">
            🚶 {plan.walking_score}/10
          </span>
        )}
      </div>

      <Link
        href={`/trips/${tripId}/plans/${plan.id}`}
        className="block w-full text-center bg-white/80 hover:bg-white border border-current rounded-lg py-2 text-sm font-medium transition-colors"
      >
        {t('planCard', 'viewPlan', lang)}
      </Link>
    </div>
  );
}
