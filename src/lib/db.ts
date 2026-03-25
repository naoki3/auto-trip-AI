import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface UserRow {
  id: string;
  username: string;
  password_hash: string;
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
