# Auto Trip AI

AI-powered travel itinerary planner for Japan. Enter your origin, destination, and travel conditions — the app generates four distinct plans (fastest, cheapest, relaxed, sightseeing) using Claude AI.

## Features

- Input travel conditions: origin/destination, number of days, transport mode, luggage level, and freeform notes
- AI parses freeform notes into structured preferences (walking tolerance, pace, budget, etc.)
- Four plan types generated in parallel via Claude Haiku:
  - **Fastest** — minimize travel time and transfers
  - **Cheapest** — minimize total cost
  - **Relaxed** — account for luggage and physical load
  - **Sightseeing** — maximize tourist spots
- Per-plan detail view with a day-by-day timeline (spots, transit legs, meals, hotels)
- Google Maps links on every transit leg
- AI replanning: modify any plan with a freeform request

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com/) project
- An [Anthropic](https://console.anthropic.com/) API key

### Setup

1. Install dependencies:

```bash
npm install
```

2. Apply the database schema in your Supabase SQL editor:

```bash
# Run the contents of supabase/schema.sql
```

3. Create a `.env.local` file:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
ANTHROPIC_API_KEY=sk-ant-...
SESSION_SECRET=a-long-random-string
```

4. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Default Admin Account

On first run, an admin account is created automatically:

| Username | Password   |
|----------|------------|
| `admin`  | `admin123` |

**Change this password before deploying.**

## Usage

1. Register or log in
2. Click **新しい旅行を計画する** on the home screen
3. Fill in the travel conditions form and submit
4. Wait 30–60 seconds while AI generates four plans
5. Click any plan card to view the full day-by-day schedule
6. Use the **再設計** form at the bottom of a plan to request changes

## Screen Flow

```
/ (trip list)
└── /trips/new          ← condition input form
└── /trips/:id/plans    ← four plan cards (AI generation happens here)
    └── /trips/:id/plans/:planId  ← timeline detail + replan form
```

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Framework  | Next.js 16 (App Router, Suspense)   |
| Language   | TypeScript                          |
| Styling    | Tailwind CSS 4                      |
| Database   | Supabase (PostgreSQL)               |
| Auth       | HMAC-signed session cookies         |
| AI         | Claude Haiku 4.5 (Anthropic SDK)    |

## Project Structure

```
src/
├── app/
│   ├── actions/
│   │   └── trips.ts          # createTrip, replanTripAction server actions
│   ├── api/
│   │   ├── trips/            # REST-style API routes
│   │   └── plans/
│   ├── trips/
│   │   └── [tripId]/
│   │       └── plans/
│   │           ├── page.tsx  # Plan list + AI generation (Suspense streaming)
│   │           └── [planId]/
│   │               └── page.tsx  # Plan detail with timeline
│   ├── login/
│   ├── register/
│   └── page.tsx              # Home (trip list)
├── components/
│   ├── TripForm.tsx          # Condition input form
│   ├── PlanCard.tsx          # Plan summary card
│   ├── ScheduleTimeline.tsx  # Day-by-day itinerary view
│   ├── ReplanForm.tsx        # AI replan request UI
│   └── Header.tsx
└── lib/
    ├── ai.ts                 # Claude API: parseUserIntent, generateTripPlans, replanTrip
    ├── db.ts                 # Supabase client (lazy proxy) + TypeScript types
    └── session.ts            # Cookie session management
```

## Environment Variables

| Variable            | Required | Description                              |
|---------------------|----------|------------------------------------------|
| `SUPABASE_URL`      | Yes      | Your Supabase project URL                |
| `SUPABASE_ANON_KEY` | Yes      | Supabase anon/public key                 |
| `ANTHROPIC_API_KEY` | Yes      | Anthropic API key for Claude Haiku       |
| `SESSION_SECRET`    | Yes      | Secret for HMAC session cookie signing   |

## AI Cost Estimate

Each trip generation calls Claude Haiku 4.5 four times in parallel (one per plan type).

| Model         | Cost per trip (approx.) |
|---------------|------------------------|
| Claude Haiku  | ~¥6 (~$0.04)           |

Replanning calls one additional Haiku request.
