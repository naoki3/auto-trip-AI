'use client';

import { useActionState } from 'react';
import { createTrip } from '@/app/actions/trips';

type State = { error?: string } | null;

export default function TripForm() {
  const [state, action, pending] = useActionState(
    async (_: State, formData: FormData) => createTrip(formData),
    null
  );

  return (
    <form action={action} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            出発地 <span className="text-red-500">*</span>
          </label>
          <input
            name="origin"
            type="text"
            required
            placeholder="例: 東京駅、羽田空港"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            行き先 <span className="text-red-500">*</span>
          </label>
          <input
            name="destination"
            type="text"
            required
            placeholder="例: 京都、福岡、沖縄"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">日数</label>
          <select
            name="days"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            <option value="1">日帰り</option>
            <option value="2">1泊2日</option>
            <option value="3" defaultValue="3">2泊3日</option>
            <option value="4">3泊4日</option>
            <option value="5">4泊5日</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">主な移動手段</label>
          <select
            name="main_transport"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            <option value="undecided">未定</option>
            <option value="train">電車・新幹線</option>
            <option value="flight">飛行機</option>
            <option value="car">車</option>
            <option value="taxi">タクシー</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">荷物レベル</label>
          <select
            name="luggage_level"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            <option value="light">軽い（リュックのみ）</option>
            <option value="normal" defaultValue="normal">普通（スーツケース小）</option>
            <option value="heavy">重い（スーツケース大）</option>
            <option value="child">子連れ</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          希望・メモ
          <span className="text-gray-400 font-normal ml-1">（任意）</span>
        </label>
        <textarea
          name="optional_note"
          rows={3}
          placeholder="例: 朝はゆっくりしたい / 歩きたくない / 海鮮が食べたい / 乗り換え少なめで / 雨なら屋内中心で"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <p className="text-xs text-gray-400 mt-1">
          自由に書くとAIが条件として解釈します
        </p>
      </div>

      {state?.error && (
        <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {pending ? 'AIがプランを生成中...' : 'プランを作成する'}
      </button>

      {pending && (
        <p className="text-center text-sm text-gray-500">
          AIが4種類のプランを考えています。少々お待ちください...
        </p>
      )}
    </form>
  );
}
