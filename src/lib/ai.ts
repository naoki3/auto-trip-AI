import Anthropic from '@anthropic-ai/sdk';
import type { TripRow, TripPreferenceRow } from './db';

const client = new Anthropic();

export interface AIPlanDay {
  day_number: number;
  title: string;
  items: AIPlanItem[];
}

export interface AIPlanItem {
  item_type: 'spot' | 'move' | 'meal' | 'hotel' | 'luggage';
  start_time: string;
  end_time: string;
  title: string;
  metadata_json: Record<string, unknown>;
}

export interface AIPlan {
  plan_type: 'fastest' | 'cheapest' | 'relaxed' | 'sightseeing';
  summary: string;
  estimated_cost: number;
  transfer_count: number;
  walking_score: number;
  days: AIPlanDay[];
}

export interface ParsedPreferences {
  walking?: 'low' | 'medium' | 'high';
  transfer?: 'low' | 'medium' | 'high';
  start_time?: 'early' | 'normal' | 'late';
  pace?: 'relaxed' | 'normal' | 'packed';
  weather_preference?: 'indoor' | 'outdoor' | 'none';
  luggage?: 'light' | 'normal' | 'heavy';
  budget?: 'low' | 'normal' | 'high';
  priority?: 'food' | 'sightseeing' | 'experience' | 'none';
}

const TRANSPORT_LABELS: Record<string, string> = {
  flight: '飛行機',
  train: '電車',
  car: '車',
  undecided: '未定',
};

const LUGGAGE_LABELS: Record<string, string> = {
  light: '軽い',
  normal: '普通',
  heavy: '重い',
  child: '子連れ',
};

export async function parseUserIntent(text: string): Promise<ParsedPreferences> {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `以下のユーザー入力を旅程条件タグに変換してください。JSONのみを返してください。

ユーザー入力: "${text}"

返すべきJSONの形式:
{
  "walking": "low|medium|high|null",
  "transfer": "low|medium|high|null",
  "start_time": "early|normal|late|null",
  "pace": "relaxed|normal|packed|null",
  "weather_preference": "indoor|outdoor|none|null",
  "luggage": "light|normal|heavy|null",
  "budget": "low|normal|high|null",
  "priority": "food|sightseeing|experience|none|null"
}

nullの場合はそのキーを省略してください。JSONのみ返してください。`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') return {};

  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return {};
    const parsed = JSON.parse(jsonMatch[0]);
    // Remove null values
    return Object.fromEntries(
      Object.entries(parsed).filter(([, v]) => v !== null && v !== 'null')
    ) as ParsedPreferences;
  } catch {
    return {};
  }
}

export async function generateTripPlans(
  trip: TripRow,
  preferences: Partial<TripPreferenceRow>
): Promise<AIPlan[]> {
  const daysLabel = trip.days === 1 ? '日帰り' : `${trip.days - 1}泊${trip.days}日`;
  const transportLabel = TRANSPORT_LABELS[trip.main_transport] ?? trip.main_transport;
  const luggageLabel = LUGGAGE_LABELS[trip.luggage_level] ?? trip.luggage_level;

  const prefLines = [
    preferences.walking && `徒歩量: ${preferences.walking}`,
    preferences.transfer && `乗り換え: ${preferences.transfer}`,
    preferences.start_time && `開始時刻: ${preferences.start_time}`,
    preferences.pace && `ペース: ${preferences.pace}`,
    preferences.weather_preference && `天気対応: ${preferences.weather_preference}`,
    preferences.budget && `予算感: ${preferences.budget}`,
    preferences.priority && `重視: ${preferences.priority}`,
  ]
    .filter(Boolean)
    .join(', ');

  const PLAN_TYPES: Array<{ type: AIPlan['plan_type']; description: string }> = [
    { type: 'fastest', description: '移動時間が最短、乗り換えや待ち時間を最小化' },
    { type: 'cheapest', description: '総費用が最安、交通費・入場料などを節約' },
    { type: 'relaxed', description: `荷物や体力を考慮しゆったりした旅程（荷物レベル「${luggageLabel}」を特に考慮）` },
    { type: 'sightseeing', description: '観光スポットを多く含む充実プラン' },
  ];

  const makePrompt = (planType: string, planDescription: string) => `あなたは日本の旅行プランナーです。以下の条件で旅程プランを1つJSON形式で生成してください。

## 旅行条件
- 出発地: ${trip.origin}
- 目的地: ${trip.destination}
- 日程: ${daysLabel}
- 主な移動手段: ${transportLabel}
- 荷物: ${luggageLabel}
${trip.optional_note ? `- 希望・メモ: ${trip.optional_note}` : ''}
${prefLines ? `- 追加条件: ${prefLines}` : ''}

## プランタイプ
"${planType}": ${planDescription}

## 出力形式（JSONのみ、コードブロック不要）
{
  "plan_type": "${planType}",
  "summary": "プランの概要（1〜2文）",
  "estimated_cost": 12000,
  "transfer_count": 1,
  "walking_score": 5,
  "days": [
    {
      "day_number": 1,
      "title": "1日目タイトル",
      "items": [
        {
          "item_type": "move",
          "start_time": "08:00",
          "end_time": "09:30",
          "title": "移動タイトル",
          "metadata_json": {
            "from": "出発地",
            "to": "到着地",
            "method": "train",
            "duration_minutes": 90,
            "price": 1500,
            "transfer_count": 1,
            "notes": "備考",
            "gmaps_url": "https://www.google.com/maps/dir/出発地/到着地/"
          }
        },
        {
          "item_type": "spot",
          "start_time": "10:00",
          "end_time": "11:30",
          "title": "スポット名",
          "metadata_json": {
            "description": "説明",
            "gmaps_url": "https://www.google.com/maps/search/スポット名/"
          }
        }
      ]
    }
  ]
}

## ルール
- 各日の移動ブロック（move）はスポット間に必ず入れること
- 重い荷物の場合はコインロッカーや荷物預かり（luggageアイテム）を含めること
- gmaps_urlはGoogle Maps形式で実際に機能するURLを生成すること
- 時刻は現実的な所要時間を考慮すること
- JSONオブジェクトのみ返してください（配列ではなく）`;

  const results = await Promise.all(
    PLAN_TYPES.map(async ({ type, description }) => {
      let rawText = '';
      try {
        const message = await client.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 16000,
          messages: [{ role: 'user', content: makePrompt(type, description) }],
        });
        const content = message.content[0];
        if (content.type !== 'text') return null;
        rawText = content.text;
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;
        return JSON.parse(jsonMatch[0]) as AIPlan;
      } catch (e) {
        console.error(`[ai] error for ${type}:`, e);
        return null;
      }
    })
  );

  const plans = results.filter((p): p is AIPlan => p !== null);
  console.log('[ai] generated plans:', plans.map(p => p.plan_type));
  return plans;
}

export async function replanTrip(
  trip: TripRow,
  existingPlanSummary: string,
  userRequest: string
): Promise<{ plans: AIPlan[]; parsedConditions: ParsedPreferences; resultSummary: string }> {
  const daysLabel = trip.days === 1 ? '日帰り' : `${trip.days - 1}泊${trip.days}日`;
  const transportLabel = TRANSPORT_LABELS[trip.main_transport] ?? trip.main_transport;
  const luggageLabel = LUGGAGE_LABELS[trip.luggage_level] ?? trip.luggage_level;

  const [parsedConditions, replanMessage] = await Promise.all([
    parseUserIntent(userRequest),
    client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      messages: [
        {
          role: 'user',
          content: `あなたは旅行プランナーです。ユーザーの要望に基づいて旅程を再設計してください。

## 元の旅行条件
- 出発地: ${trip.origin}
- 目的地: ${trip.destination}
- 日程: ${daysLabel}
- 主な移動手段: ${transportLabel}
- 荷物: ${luggageLabel}

## 現在のプラン概要
${existingPlanSummary}

## ユーザーの再設計要望
"${userRequest}"

## 出力形式（JSONのみ）
{
  "result_summary": "変更内容の説明（1〜3文）",
  "plans": [/* 上記と同じAIPlan形式の配列（1〜2プラン） */]
}

再設計は要望を反映しつつ、現実的な旅程になるようにしてください。JSONのみ返してください。`,
        },
      ],
    }),
  ]);

  const content = replanMessage.content[0];
  if (content.type !== 'text') {
    return { plans: [], parsedConditions, resultSummary: '' };
  }

  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { plans: [], parsedConditions, resultSummary: '' };
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      plans: parsed.plans ?? [],
      parsedConditions,
      resultSummary: parsed.result_summary ?? '',
    };
  } catch {
    return { plans: [], parsedConditions, resultSummary: '' };
  }
}
