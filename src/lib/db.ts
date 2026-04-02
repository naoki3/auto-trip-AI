import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | undefined;

function getClient(): SupabaseClient {
  if (!_client) {
    // Use service_role key on the server so we bypass RLS.
    // RLS is enabled on all tables with no permissive policies,
    // so the anon key cannot access any data even if leaked.
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY!;
    _client = createClient(process.env.SUPABASE_URL!, key);
  }
  return _client;
}

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getClient();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

export interface UserRow {
  id: string;
  username: string;
  password_hash: string | null;
  email: string | null;
  google_id: string | null;
  stripe_customer_id: string | null;
  subscription_status: 'free' | 'active' | 'canceled' | 'past_due';
  subscription_end_date: string | null;
  email_verified: number;
  email_verification_token: string | null;
  is_admin: number;
  created_at: string;
}

export interface TripRow {
  id: string;
  user_id: string;
  origin: string;
  destination: string;
  days: number;
  main_transport: string;
  luggage_level: string;
  optional_note: string | null;
  created_at: string;
}

export interface TripPreferenceRow {
  id: string;
  trip_id: string;
  walking: string | null;
  transfer: string | null;
  start_time: string | null;
  pace: string | null;
  weather_preference: string | null;
  luggage: string | null;
  budget: string | null;
  priority: string | null;
  parsed_json: string | null;
  created_at: string;
}

export interface PlanRow {
  id: string;
  trip_id: string;
  plan_type: 'fastest' | 'cheapest' | 'relaxed' | 'sightseeing';
  summary: string | null;
  estimated_cost: number | null;
  transfer_count: number | null;
  walking_score: number | null;
  created_at: string;
}

export interface ItineraryDayRow {
  id: string;
  plan_id: string;
  day_number: number;
  title: string | null;
  created_at: string;
}

export interface ItineraryItemRow {
  id: string;
  day_id: string;
  item_type: 'spot' | 'move' | 'meal' | 'hotel' | 'luggage';
  start_time: string | null;
  end_time: string | null;
  title: string;
  metadata_json: string | null;
  sort_order: number;
  created_at: string;
}

export interface MoveMetadata {
  from: string;
  to: string;
  method: 'train' | 'bus' | 'walk' | 'taxi' | 'flight' | 'car';
  duration_minutes: number;
  price: number;
  transfer_count: number;
  notes?: string;
  gmaps_url: string;
}

export interface LuggageMetadata {
  action: 'store' | 'pickup' | 'send';
  location: string;
  notes?: string;
}

export interface ReplanningRequestRow {
  id: string;
  plan_id: string;
  user_text: string;
  parsed_conditions_json: string | null;
  result_summary: string | null;
  new_plan_id: string | null;
  created_at: string;
}
