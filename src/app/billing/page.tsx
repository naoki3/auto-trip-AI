'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function BillingContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');

  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);

  useEffect(() => {
    if (success) {
      // Sync subscription status from Stripe after successful checkout
      fetch('/api/stripe/sync', { method: 'POST' })
        .then((r) => r.json())
        .then((d) => setSubscriptionStatus(d.subscription_status ?? null))
        .catch(() => null);
      window.history.replaceState({}, '', '/billing');
    }
  }, [success]);

  const isPro = subscriptionStatus === 'active';

  async function handleCheckout() {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoading(false);
    }
  }

  async function handlePortal() {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setPortalLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-700 text-white shadow">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight">✈️ Auto Trip AI</Link>
          <Link href="/" className="text-sm text-blue-200 hover:text-white">← 旅行一覧に戻る</Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">プランと請求</h1>
        <p className="text-gray-500 text-sm mb-8">サブスクリプションを管理できます</p>

        {success === '1' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-green-700 text-sm font-medium">
            サブスクリプションが有効化されました！
          </div>
        )}
        {canceled === '1' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-yellow-700 text-sm font-medium">
            お支払いがキャンセルされました。
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Free plan */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-800">無料プラン</h2>
              {!isPro && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">現在のプラン</span>}
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">¥0<span className="text-base font-normal text-gray-500">/月</span></p>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span>旅行プラン作成 3件まで</li>
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span>AIプラン生成</li>
              <li className="flex items-center gap-2"><span className="text-gray-400">✗</span>無制限プラン作成</li>
              <li className="flex items-center gap-2"><span className="text-gray-400">✗</span>優先サポート</li>
            </ul>
          </div>

          {/* Pro plan */}
          <div className="bg-white rounded-xl border-2 border-blue-500 p-6 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full font-medium">おすすめ</span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-800">Pro プラン</h2>
              {isPro && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">現在のプラン</span>}
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">¥1,000<span className="text-base font-normal text-gray-500">/月</span></p>
            <ul className="mt-4 space-y-2 text-sm text-gray-600 mb-6">
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span>旅行プラン作成 無制限</li>
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span>AIプラン生成</li>
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span>無制限プラン作成</li>
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span>優先サポート</li>
            </ul>
            {!isPro && (
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? '処理中...' : 'Pro にアップグレード'}
              </button>
            )}
          </div>
        </div>

        <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-800 mb-2">請求管理</h2>
          <p className="text-sm text-gray-500 mb-4">Stripe のカスタマーポータルで請求情報・サブスクリプションを管理できます。</p>
          <button
            onClick={handlePortal}
            disabled={portalLoading}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50 transition-colors"
          >
            {portalLoading ? '読み込み中...' : 'カスタマーポータルを開く'}
          </button>
        </div>
      </main>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">読み込み中...</div>}>
      <BillingContent />
    </Suspense>
  );
}
