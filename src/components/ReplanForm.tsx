'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { t, getReplanSuggestions, type Lang } from '@/lib/i18n';

interface Props {
  planId: string;
  tripId: string;
  lang: Lang;
}

export default function ReplanForm({ planId, tripId, lang }: Props) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultSummary, setResultSummary] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const suggestions = getReplanSuggestions(lang);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setError('');
    setResultSummary('');

    const res = await fetch(`/api/plans/${planId}/replan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_text: text.trim() }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? t('replan', 'errorDefault', lang));
      return;
    }

    const data = await res.json();

    if (data.result_summary) {
      setResultSummary(data.result_summary);
    }

    if (data.new_plan_id) {
      setTimeout(() => {
        router.push(`/trips/${tripId}/plans/${data.new_plan_id}`);
      }, 1500);
    }
  }

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
      <h3 className="font-bold text-purple-800 mb-3 flex items-center gap-2">
        <span>✨</span>
        {t('replan', 'title', lang)}
      </h3>

      <div className="flex flex-wrap gap-2 mb-3">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setText(s)}
            className="text-xs bg-white border border-purple-200 text-purple-700 px-2 py-1 rounded-full hover:bg-purple-100 transition-colors"
          >
            {s}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder={t('replan', 'placeholder', lang)}
          className="w-full border border-purple-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white resize-none text-gray-900"
        />

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        {resultSummary && (
          <div className="bg-purple-100 border border-purple-300 rounded-lg px-3 py-2 text-sm text-purple-800">
            <p className="font-medium mb-1">{t('replan', 'changesLabel', lang)}</p>
            <p>{resultSummary}</p>
            <p className="text-xs mt-1 text-purple-600">{t('replan', 'redirecting', lang)}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="w-full bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? t('replan', 'submitting', lang) : t('replan', 'submit', lang)}
        </button>
      </form>
    </div>
  );
}
