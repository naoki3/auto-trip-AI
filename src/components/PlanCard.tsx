import Link from 'next/link';
import type { PlanRow } from '@/lib/db';

const PLAN_TYPE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  fastest: { label: '最短', icon: '⚡', color: 'bg-yellow-50 border-yellow-300 text-yellow-800' },
  cheapest: { label: '最安', icon: '💴', color: 'bg-green-50 border-green-300 text-green-800' },
  relaxed: { label: '楽・荷物考慮', icon: '🧳', color: 'bg-blue-50 border-blue-300 text-blue-800' },
  sightseeing: { label: '観光重視', icon: '🗺️', color: 'bg-purple-50 border-purple-300 text-purple-800' },
};

interface Props {
  plan: PlanRow;
  tripId: string;
}

export default function PlanCard({ plan, tripId }: Props) {
  const meta = PLAN_TYPE_LABELS[plan.plan_type] ?? {
    label: plan.plan_type,
    icon: '📋',
    color: 'bg-gray-50 border-gray-300 text-gray-800',
  };

  return (
    <div className={`border-2 rounded-xl p-4 ${meta.color}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{meta.icon}</span>
        <span className="font-bold text-base">{meta.label}</span>
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
            🔁 乗り換え {plan.transfer_count}回
          </span>
        )}
        {plan.walking_score != null && (
          <span className="bg-white/60 rounded-full px-2 py-0.5">
            🚶 歩き {plan.walking_score}/10
          </span>
        )}
      </div>

      <Link
        href={`/trips/${tripId}/plans/${plan.id}`}
        className="block w-full text-center bg-white/80 hover:bg-white border border-current rounded-lg py-2 text-sm font-medium transition-colors"
      >
        このプランを見る →
      </Link>
    </div>
  );
}
