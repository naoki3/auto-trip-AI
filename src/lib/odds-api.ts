import { cacheLife } from 'next/cache';

const BASE_URL = 'https://api.the-odds-api.com/v4';
const API_KEY = process.env.ODDS_API_KEY ?? '';

// Map football-data.org competition names → The Odds API sport keys
const LEAGUE_TO_SPORT: Record<string, string> = {
  'Premier League': 'soccer_epl',
  'UEFA Champions League': 'soccer_uefa_champs_league',
  'Primera Division': 'soccer_spain_la_liga',
  'Bundesliga': 'soccer_germany_bundesliga',
  'Serie A': 'soccer_italy_serie_a',
  'Ligue 1': 'soccer_france_ligue_one',
};

interface OddsApiOutcome {
  name: string;
  price: number;
}

interface OddsApiBookmaker {
  key: string;
  markets: Array<{ key: string; outcomes: OddsApiOutcome[] }>;
}

interface OddsApiEvent {
  id: string;
  home_team: string;
  away_team: string;
  bookmakers: OddsApiBookmaker[];
}

export interface BookmakerOdds {
  home: number;
  draw: number;
  away: number;
  bookmakerCount: number;
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(f\.?c\.?|a\.?f\.?c\.?)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function teamsMatch(apiName: string, dbName: string): boolean {
  const a = normalizeName(apiName);
  const b = normalizeName(dbName);
  return a === b || a.includes(b) || b.includes(a);
}

async function fetchSportOdds(sportKey: string): Promise<OddsApiEvent[]> {
  'use cache';
  cacheLife('minutes'); // revalidate every 15 minutes
  const url = `${BASE_URL}/sports/${sportKey}/odds?apiKey=${API_KEY}&regions=eu&markets=h2h&oddsFormat=decimal`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    console.warn(`Odds API error for ${sportKey}: ${res.status}`);
    return [];
  }
  return res.json() as Promise<OddsApiEvent[]>;
}

export async function getBookmakerOdds(
  homeTeam: string,
  awayTeam: string,
  league: string
): Promise<BookmakerOdds | null> {
  if (!API_KEY) return null;

  const sportKey = LEAGUE_TO_SPORT[league];
  if (!sportKey) return null;

  const events = await fetchSportOdds(sportKey);

  const event = events.find(
    (e) => teamsMatch(e.home_team, homeTeam) && teamsMatch(e.away_team, awayTeam)
  );
  if (!event || event.bookmakers.length === 0) return null;

  let homeSum = 0, drawSum = 0, awaySum = 0, count = 0;

  for (const bm of event.bookmakers) {
    const market = bm.markets.find((m) => m.key === 'h2h');
    if (!market) continue;

    const homeOdds = market.outcomes.find((o) => teamsMatch(o.name, homeTeam));
    const awayOdds = market.outcomes.find((o) => teamsMatch(o.name, awayTeam));
    const drawOdds = market.outcomes.find((o) => o.name === 'Draw');

    if (homeOdds && awayOdds && drawOdds) {
      homeSum += homeOdds.price;
      awaySum += awayOdds.price;
      drawSum += drawOdds.price;
      count++;
    }
  }

  if (count === 0) return null;

  return {
    home: homeSum / count,
    draw: drawSum / count,
    away: awaySum / count,
    bookmakerCount: count,
  };
}
