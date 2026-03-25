import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { supabase, MatchRow } from '@/lib/db';
import { getMatchPrediction } from '@/lib/ai-prediction';
import { getBookmakerOdds } from '@/lib/odds-api';
import Header from '@/components/Header';
import MatchList from '@/components/MatchList';

interface HistoricalMatch {
  home_team: string;
  away_team: string;
  result: string;
  home_score: number | null;
  away_score: number | null;
  league: string;
}

function buildHistoryContext(
  homeTeam: string,
  awayTeam: string,
  league: string,
  history: HistoricalMatch[]
): string {
  const leagueMatches = history
    .filter((m) => m.league === league)
    .slice(0, 15)
    .map((m) => `  ${m.home_team} ${m.home_score ?? '?'}-${m.away_score ?? '?'} ${m.away_team}`)
    .join('\n');

  const teamMatches = history
    .filter(
      (m) =>
        m.home_team === homeTeam ||
        m.away_team === homeTeam ||
        m.home_team === awayTeam ||
        m.away_team === awayTeam
    )
    .slice(0, 8)
    .map((m) => `  ${m.home_team} ${m.home_score ?? '?'}-${m.away_score ?? '?'} ${m.away_team}`)
    .join('\n');

  return [
    `Recent ${league} results:\n${leagueMatches || '  No data yet'}`,
    `Recent matches involving ${homeTeam} or ${awayTeam}:\n${teamMatches || '  No data yet'}`,
  ].join('\n\n');
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  const session = await getSession();
  if (!session) redirect('/login');

  const [matchesResult, historyResult] = await Promise.all([
    supabase
      .from('matches')
      .select('*')
      .in('status', ['upcoming', 'live', 'finished', 'settled'])
      .order('kickoff', { ascending: true }),
    supabase
      .from('matches')
      .select('home_team, away_team, result, home_score, away_score, league')
      .in('status', ['finished', 'settled'])
      .not('result', 'is', null)
      .order('kickoff', { ascending: false })
      .limit(100),
  ]);

  const matches = (matchesResult.data ?? []) as MatchRow[];
  const history = (historyResult.data ?? []) as HistoricalMatch[];

  const matchesWithData = await Promise.all(
    matches.map(async (m) => {
      const historyContext = buildHistoryContext(m.home_team, m.away_team, m.league, history);
      const isUpcoming = m.status === 'upcoming' || m.status === 'live';

      const [prediction, bookmakerOdds] = await Promise.all([
        getMatchPrediction(m.id, m.home_team, m.away_team, m.league, historyContext).catch(() => null),
        isUpcoming
          ? getBookmakerOdds(m.home_team, m.away_team, m.league).catch(() => null)
          : Promise.resolve(null),
      ]);

      return { ...m, prediction, bookmakerOdds };
    })
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header username={session.username} isAdmin={session.isAdmin} />
      <main className="max-w-2xl mx-auto px-4 py-4">
        <MatchList matches={matchesWithData} />
      </main>
    </div>
  );
}
