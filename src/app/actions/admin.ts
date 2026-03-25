'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/db';
import { getSession } from '@/lib/session';
import { fetchRecentMatches, fetchUpcomingMatches } from '@/lib/football';

export async function syncMatches() {
  const session = await getSession();
  if (!session?.isAdmin) return { error: 'Permission denied' };

  let matches;
  try {
    const [recent, upcoming] = await Promise.all([fetchRecentMatches(), fetchUpcomingMatches()]);
    // deduplicate by externalId (upcoming may overlap with recent)
    const seen = new Set<number>();
    matches = [...recent, ...upcoming].filter((m) => {
      if (seen.has(m.externalId)) return false;
      seen.add(m.externalId);
      return true;
    });
  } catch (e) {
    return { error: `Failed to fetch match data: ${e instanceof Error ? e.message : String(e)}` };
  }
  let added = 0;
  let updated = 0;

  for (const m of matches) {
    const { data: existing } = await supabase
      .from('matches')
      .select('id, status')
      .eq('external_id', m.externalId)
      .single();

    if (!existing) {
      await supabase.from('matches').insert({
        id: crypto.randomUUID(),
        external_id: m.externalId,
        home_team: m.homeTeam,
        away_team: m.awayTeam,
        league: m.league,
        kickoff: m.kickoff,
        status: m.status,
        home_score: m.homeScore,
        away_score: m.awayScore,
        created_at: new Date().toISOString(),
      });
      added++;
    } else if (existing.status !== 'settled') {
      await supabase
        .from('matches')
        .update({ status: m.status, home_score: m.homeScore, away_score: m.awayScore })
        .eq('id', existing.id);
      updated++;
    }
  }

  revalidatePath('/');
  revalidatePath('/admin');
  return { success: true, added, updated };
}
