'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  tripId: string;
}

export default function PlanGenerator({ tripId }: Props) {
  const [status, setStatus] = useState<'generating' | 'done' | 'error'>('generating');
  const router = useRouter();

  useEffect(() => {
    let stopped = false;

    async function generate() {
      try {
        const res = await fetch(`/api/trips/${tripId}/generate-plans`, { method: 'POST' });
        if (!res.ok) throw new Error('Failed');
        if (!stopped) {
          setStatus('done');
          router.refresh();
        }
      } catch {
        if (!stopped) setStatus('error');
      }
    }

    generate();
    return () => { stopped = true; };
  }, [tripId, router]);

  if (status === 'error') {
    return (
      <div className="text-center py-12 text-red-500 bg-white rounded-xl border">
        <p className="text-3xl mb-3">⚠️</p>
        <p className="font-medium">プラン生成に失敗しました</p>
        <button
          onClick={() => { setStatus('generating'); }}
          className="mt-3 text-sm text-blue-600 hover:underline"
        >
          再試行
        </button>
      </div>
    );
  }

  return (
    <div className="text-center py-12 text-gray-500 bg-white rounded-xl border">
      <div className="flex justify-center mb-4">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="font-medium">AIがプランを生成中...</p>
      <p className="text-sm mt-1 text-gray-400">4種類のプランを考えています（30〜60秒）</p>
    </div>
  );
}
