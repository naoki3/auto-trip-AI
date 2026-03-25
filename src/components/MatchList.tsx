import { MatchRow } from '@/lib/db';
import { MatchPrediction } from '@/lib/ai-prediction';
import { BookmakerOdds } from '@/lib/odds-api';

interface MatchWithData extends MatchRow {
  prediction: MatchPrediction | null;
  bookmakerOdds: BookmakerOdds | null;
}

interface Props {
  matches: MatchWithData[];
}

const STATUS_LABEL: Record<string, string> = {
  upcoming: 'Upcoming',
  live: 'LIVE',
  finished: 'Finished',
  settled: 'Settled',
};

const STATUS_COLOR: Record<string, string> = {
  upcoming: 'bg-blue-100 text-blue-700',
  live: 'bg-red-100 text-red-700 animate-pulse',
  finished: 'bg-gray-100 text-gray-500',
  settled: 'bg-green-100 text-green-700',
};

const OUTCOME_LABEL = (o: string, home: string, away: string) =>
  o === 'home' ? home : o === 'away' ? away : 'Draw';

// value = realOdds / aiOdds - 1  (positive = real odds are higher = potential value)
function calcValue(real: number, ai: number): number {
  return real / ai - 1;
}

interface ValueInfo {
  outcome: 'home' | 'draw' | 'away';
  label: string;
  realOdds: number;
  aiOdds: number;
  value: number;
}

function getBestValue(
  bookmaker: BookmakerOdds,
  prediction: MatchPrediction,
  homeTeam: string,
  awayTeam: string
): ValueInfo | null {
  const candidates: ValueInfo[] = (
    [
      ['home', bookmaker.home, prediction.home],
      ['draw', bookmaker.draw, prediction.draw],
      ['away', bookmaker.away, prediction.away],
    ] as const
  ).map(([outcome, real, ai]) => ({
    outcome,
    label: OUTCOME_LABEL(outcome, homeTeam, awayTeam),
    realOdds: real,
    aiOdds: ai,
    value: calcValue(real, ai),
  }));

  const best = candidates.reduce((a, b) => (a.value > b.value ? a : b));
  return best.value >= 0.1 ? best : null;
}

export default function MatchList({ matches }: Props) {
  const upcoming = matches.filter((m) => m.status === 'upcoming' || m.status === 'live');
  const done = matches.filter((m) => m.status === 'finished' || m.status === 'settled');

  if (matches.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">
        No match data available. Please wait for the administrator to sync data.
      </div>
    );
  }

  // Top value picks across all upcoming matches
  const valuePicks = upcoming
    .flatMap((m) => {
      if (!m.bookmakerOdds || !m.prediction) return [];
      const v = getBestValue(m.bookmakerOdds, m.prediction, m.home_team, m.away_team);
      if (!v) return [];
      return [{ match: m, valueInfo: v }];
    })
    .sort((a, b) => b.valueInfo.value - a.valueInfo.value)
    .slice(0, 3);

  return (
    <>
      {valuePicks.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">
            ★ AI Recommended Value Picks
          </h2>
          <div className="space-y-2">
            {valuePicks.map(({ match: m, valueInfo: v }) => (
              <div
                key={m.id}
                className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {m.home_team} vs {m.away_team}
                  </p>
                  <p className="text-xs text-gray-500">{m.league}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-amber-700">
                    {v.label} @ {v.realOdds.toFixed(2)}
                  </p>
                  <p className="text-xs text-amber-600">
                    +{(v.value * 100).toFixed(0)}% above AI odds
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="space-y-3 mb-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Upcoming / LIVE</h2>
          {upcoming.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </section>
      )}

      {done.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Finished Matches</h2>
          {done.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </section>
      )}
    </>
  );
}

function MatchCard({ match: m }: { match: MatchWithData }) {
  const p = m.prediction;
  const bm = m.bookmakerOdds;

  const outcomes = ['home', 'draw', 'away'] as const;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">{m.league}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[m.status]}`}>
          {STATUS_LABEL[m.status]}
        </span>
      </div>

      {/* Teams & Score */}
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-sm text-gray-800 flex-1 text-left">{m.home_team}</span>
        {m.home_score != null && m.away_score != null ? (
          <span className="text-lg font-bold text-gray-700 px-3">
            {m.home_score} - {m.away_score}
          </span>
        ) : (
          <span className="text-xs text-gray-400 px-3">
            {new Date(m.kickoff).toLocaleString('en-US', {
              month: 'numeric',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}
        <span className="font-semibold text-sm text-gray-800 flex-1 text-right">{m.away_team}</span>
      </div>

      {m.result && (
        <p className="text-xs text-center text-green-600 font-medium mb-2">
          Result: {OUTCOME_LABEL(m.result, m.home_team, m.away_team)}
        </p>
      )}

      {/* Odds table */}
      <div className="mt-3">
        {/* Column headers */}
        <div className="grid grid-cols-3 gap-2 mb-1">
          {outcomes.map((sel) => {
            const label = sel === 'home' ? m.home_team : sel === 'away' ? m.away_team : 'Draw';
            return (
              <p key={sel} className="text-xs text-gray-400 text-center truncate">{label}</p>
            );
          })}
        </div>

        {/* Real odds row */}
        {bm && p ? (
          <div className="grid grid-cols-3 gap-2 mb-1">
            {outcomes.map((sel) => {
              const realOdds = bm[sel];
              const aiOdds = p[sel];
              const value = calcValue(realOdds, aiOdds);
              const isValue = value >= 0.1;
              const isOverpriced = value <= -0.1;

              return (
                <div
                  key={sel}
                  className={`rounded-lg py-1.5 px-1 text-center border ${
                    isValue
                      ? 'border-green-300 bg-green-50'
                      : isOverpriced
                      ? 'border-red-100 bg-red-50'
                      : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  <p className="text-xs text-gray-400 leading-none mb-0.5">Bookmaker</p>
                  <p className={`text-base font-bold ${isValue ? 'text-green-700' : isOverpriced ? 'text-red-500' : 'text-gray-700'}`}>
                    {realOdds.toFixed(2)}
                  </p>
                  <p className={`text-xs font-medium ${isValue ? 'text-green-600' : isOverpriced ? 'text-red-400' : 'text-gray-400'}`}>
                    {value >= 0 ? '+' : ''}{(value * 100).toFixed(0)}%
                    {isValue && ' ★'}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 mb-1">
            {outcomes.map((sel) => (
              <div key={sel} className="rounded-lg py-1.5 px-1 text-center border border-dashed border-gray-200 bg-gray-50">
                <p className="text-xs text-gray-300 leading-none mb-0.5">Bookmaker</p>
                <p className="text-sm text-gray-300">—</p>
              </div>
            ))}
          </div>
        )}

        {/* AI odds row */}
        {p ? (
          <div className="grid grid-cols-3 gap-2">
            {outcomes.map((sel) => (
              <div key={sel} className="rounded-lg py-1.5 px-1 text-center border border-blue-100 bg-blue-50">
                <p className="text-xs text-blue-400 leading-none mb-0.5">AI Prediction</p>
                <p className="text-base font-bold text-blue-700">{p[sel].toFixed(2)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {outcomes.map((sel) => (
              <div key={sel} className="rounded-lg py-1.5 px-1 text-center border border-dashed border-blue-100 bg-blue-50">
                <p className="text-xs text-blue-300 leading-none mb-0.5">AI Prediction</p>
                <p className="text-sm text-blue-300">—</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bookmaker count + reasoning */}
      <div className="mt-2 flex items-start justify-between gap-2">
        {bm && (
          <p className="text-xs text-gray-300 shrink-0">Avg. {bm.bookmakerCount} bookmakers</p>
        )}
        {p && (
          <p className="text-xs text-gray-400 italic text-right">{p.reasoning}</p>
        )}
      </div>
    </div>
  );
}
