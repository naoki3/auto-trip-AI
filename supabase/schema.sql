-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  email TEXT UNIQUE,
  google_id TEXT UNIQUE,
  stripe_customer_id TEXT UNIQUE,
  subscription_status TEXT NOT NULL DEFAULT 'free',
  subscription_end_date TEXT,
  is_admin INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

-- Trips table
CREATE TABLE IF NOT EXISTS trips (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  days INTEGER NOT NULL,
  main_transport TEXT NOT NULL,
  luggage_level TEXT NOT NULL,
  optional_note TEXT,
  created_at TEXT NOT NULL
);

-- Trip preferences (AI-parsed condition tags)
CREATE TABLE IF NOT EXISTS trip_preferences (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL REFERENCES trips(id),
  walking TEXT,
  transfer TEXT,
  start_time TEXT,
  pace TEXT,
  weather_preference TEXT,
  luggage TEXT,
  budget TEXT,
  priority TEXT,
  parsed_json TEXT,
  created_at TEXT NOT NULL
);

-- Plans (comparison candidates)
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL REFERENCES trips(id),
  plan_type TEXT NOT NULL,
  summary TEXT,
  estimated_cost INTEGER,
  transfer_count INTEGER,
  walking_score INTEGER,
  created_at TEXT NOT NULL
);

-- Itinerary days
CREATE TABLE IF NOT EXISTS itinerary_days (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES plans(id),
  day_number INTEGER NOT NULL,
  title TEXT,
  created_at TEXT NOT NULL
);

-- Itinerary items (spots, moves, meals, hotels, luggage)
CREATE TABLE IF NOT EXISTS itinerary_items (
  id TEXT PRIMARY KEY,
  day_id TEXT NOT NULL REFERENCES itinerary_days(id),
  item_type TEXT NOT NULL,
  start_time TEXT,
  end_time TEXT,
  title TEXT NOT NULL,
  metadata_json TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

-- Replanning requests and history
CREATE TABLE IF NOT EXISTS replanning_requests (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES plans(id),
  user_text TEXT NOT NULL,
  parsed_conditions_json TEXT,
  result_summary TEXT,
  new_plan_id TEXT REFERENCES plans(id),
  created_at TEXT NOT NULL
);
