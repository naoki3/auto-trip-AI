import type { ItineraryDayRow, ItineraryItemRow, MoveMetadata, LuggageMetadata } from '@/lib/db';
import { t, type Lang } from '@/lib/i18n';

const ITEM_TYPE_CONFIG = {
  spot: { icon: '📍', color: 'border-blue-300 bg-blue-50' },
  meal: { icon: '🍽️', color: 'border-orange-300 bg-orange-50' },
  hotel: { icon: '🏨', color: 'border-indigo-300 bg-indigo-50' },
  move: { icon: '🚃', color: 'border-gray-300 bg-gray-50' },
  luggage: { icon: '🧳', color: 'border-yellow-300 bg-yellow-50' },
};

const METHOD_ICONS: Record<string, string> = {
  train: '🚃',
  bus: '🚌',
  walk: '🚶',
  taxi: '🚕',
  flight: '✈️',
  car: '🚗',
};

const METHOD_LABEL_KEYS: Record<string, 'methodTrain' | 'methodBus' | 'methodWalk' | 'methodTaxi' | 'methodFlight' | 'methodCar'> = {
  train: 'methodTrain',
  bus: 'methodBus',
  walk: 'methodWalk',
  taxi: 'methodTaxi',
  flight: 'methodFlight',
  car: 'methodCar',
};

const ACTION_LABEL_KEYS: Record<string, 'actionStore' | 'actionPickup' | 'actionSend'> = {
  store: 'actionStore',
  pickup: 'actionPickup',
  send: 'actionSend',
};

interface DayWithItems extends ItineraryDayRow {
  items: ItineraryItemRow[];
}

interface Props {
  days: DayWithItems[];
  lang: Lang;
}

function MoveDetail({ item, lang }: { item: ItineraryItemRow; lang: Lang }) {
  const meta = item.metadata_json ? (JSON.parse(item.metadata_json) as MoveMetadata) : null;
  if (!meta) return null;

  const methodLabelKey = METHOD_LABEL_KEYS[meta.method];
  const methodLabel = methodLabelKey ? t('timeline', methodLabelKey, lang) : meta.method;

  return (
    <div className="mt-2 text-xs space-y-1 text-gray-600">
      <div className="flex flex-wrap gap-3">
        <span>{methodLabel}</span>
        <span>約{meta.duration_minutes}分</span>
        {meta.price > 0 && <span>¥{meta.price.toLocaleString()}</span>}
        {meta.transfer_count > 0 && <span>乗換{meta.transfer_count}回</span>}
      </div>
      {meta.notes && <p className="text-gray-500">{meta.notes}</p>}
      {meta.gmaps_url && (
        <a
          href={meta.gmaps_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-blue-600 hover:underline"
        >
          {t('timeline', 'openMaps', lang)}
        </a>
      )}
    </div>
  );
}

function LuggageDetail({ item, lang }: { item: ItineraryItemRow; lang: Lang }) {
  const meta = item.metadata_json ? (JSON.parse(item.metadata_json) as LuggageMetadata) : null;
  if (!meta) return null;

  const actionLabelKey = ACTION_LABEL_KEYS[meta.action];
  const actionLabel = actionLabelKey ? t('timeline', actionLabelKey, lang) : meta.action;

  return (
    <div className="mt-1 text-xs text-gray-600">
      <span className="bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
        {actionLabel}
      </span>
      {meta.location && <span className="ml-1">{meta.location}</span>}
      {meta.notes && <p className="mt-1 text-gray-500">{meta.notes}</p>}
    </div>
  );
}

function TimelineItem({ item, lang }: { item: ItineraryItemRow; lang: Lang }) {
  const config = ITEM_TYPE_CONFIG[item.item_type] ?? ITEM_TYPE_CONFIG.spot;
  const icon = item.item_type === 'move' && item.metadata_json
    ? (METHOD_ICONS[(JSON.parse(item.metadata_json) as MoveMetadata).method] ?? config.icon)
    : config.icon;

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-sm flex-shrink-0">
          {icon}
        </div>
        <div className="w-0.5 bg-gray-200 flex-1 mt-1" />
      </div>
      <div className={`flex-1 mb-3 border rounded-lg p-3 ${config.color}`}>
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-sm text-gray-800">{item.title}</p>
          {(item.start_time || item.end_time) && (
            <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
              {item.start_time}{item.end_time ? `〜${item.end_time}` : ''}
            </span>
          )}
        </div>
        {item.item_type === 'move' && <MoveDetail item={item} lang={lang} />}
        {item.item_type === 'luggage' && <LuggageDetail item={item} lang={lang} />}
        {item.item_type === 'spot' && item.metadata_json && (() => {
          const meta = JSON.parse(item.metadata_json);
          return meta.gmaps_url ? (
            <a
              href={meta.gmaps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 text-xs text-blue-600 hover:underline inline-block"
            >
              {t('timeline', 'openMaps', lang)}
            </a>
          ) : null;
        })()}
      </div>
    </div>
  );
}

export default function ScheduleTimeline({ days, lang }: Props) {
  if (days.length === 0) {
    return <p className="text-gray-500 text-sm text-center py-8">{t('timeline', 'noSchedule', lang)}</p>;
  }

  return (
    <div className="space-y-6">
      {days.map((day) => (
        <div key={day.id}>
          <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
            <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
              Day {day.day_number}
            </span>
            {day.title && <span>{day.title}</span>}
          </h3>
          <div>
            {day.items.map((item) => (
              <TimelineItem key={item.id} item={item} lang={lang} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
