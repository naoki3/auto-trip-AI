'use client';

import { useActionState } from 'react';
import { createTrip } from '@/app/actions/trips';
import { t, type Lang } from '@/lib/i18n';

type State = { error?: string } | null;

export default function TripForm({ lang }: { lang: Lang }) {
  const [state, action, pending] = useActionState(
    async (_: State, formData: FormData) => createTrip(formData),
    null
  );

  return (
    <form action={action} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('tripForm', 'origin', lang)} <span className="text-red-500">*</span>
          </label>
          <input
            name="origin"
            type="text"
            required
            placeholder={t('tripForm', 'originPlaceholder', lang)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('tripForm', 'destination', lang)} <span className="text-red-500">*</span>
          </label>
          <input
            name="destination"
            type="text"
            required
            placeholder={t('tripForm', 'destinationPlaceholder', lang)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('companions', 'label', lang)}</label>
        <select
          name="companions"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
        >
          <option value="">{t('companions', 'solo', lang)}</option>
          <option value={t('companions', 'couple', lang)}>{t('companions', 'couple', lang)}</option>
          <option value={t('companions', 'family', lang)}>{t('companions', 'family', lang)}</option>
          <option value={t('companions', 'group', lang)}>{t('companions', 'group', lang)}</option>
        </select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('tripForm', 'days', lang)}</label>
          <select
            name="days"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            <option value="1">{t('tripForm', 'dayTrip', lang)}</option>
            <option value="2">{t('tripForm', 'oneNight', lang)}</option>
            <option value="3" defaultValue="3">{t('tripForm', 'twoNight', lang)}</option>
            <option value="4">{t('tripForm', 'threeNight', lang)}</option>
            <option value="5">{t('tripForm', 'fourNight', lang)}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('tripForm', 'transport', lang)}</label>
          <select
            name="main_transport"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            <option value="undecided">{t('tripForm', 'transportUndecided', lang)}</option>
            <option value="train">{t('tripForm', 'transportTrain', lang)}</option>
            <option value="flight">{t('tripForm', 'transportFlight', lang)}</option>
            <option value="car">{t('tripForm', 'transportCar', lang)}</option>
            <option value="taxi">{t('tripForm', 'transportTaxi', lang)}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('tripForm', 'luggage', lang)}</label>
          <select
            name="luggage_level"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            <option value="light">{t('tripForm', 'luggageLight', lang)}</option>
            <option value="normal" defaultValue="normal">{t('tripForm', 'luggageNormal', lang)}</option>
            <option value="heavy">{t('tripForm', 'luggageHeavy', lang)}</option>
            <option value="child">{t('tripForm', 'luggageChild', lang)}</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('tripForm', 'note', lang)}
          <span className="text-gray-400 font-normal ml-1">{t('tripForm', 'noteOptional', lang)}</span>
        </label>
        <textarea
          name="optional_note"
          rows={3}
          placeholder={t('tripForm', 'notePlaceholder', lang)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900"
        />
        <p className="text-xs text-gray-400 mt-1">{t('tripForm', 'noteHint', lang)}</p>
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
        {pending ? t('tripForm', 'submitting', lang) : t('tripForm', 'submit', lang)}
      </button>

      {pending && (
        <p className="text-center text-sm text-gray-500">
          {t('tripForm', 'generating', lang)}
        </p>
      )}
    </form>
  );
}
