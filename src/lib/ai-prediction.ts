import Anthropic from '@anthropic-ai/sdk';
import { cacheLife } from 'next/cache';

const client = new Anthropic();

export interface MatchPrediction {
  home: number;
  draw: number;
  away: number;
  reasoning: string;
}

async function fetchPrediction(
  homeTeam: string,
  awayTeam: string,
  league: string,
  historyContext: string
): Promise<MatchPrediction> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 400,
    messages: [
      {
        role: 'user',
        content: `You are a football odds analyst. Predict decimal odds for this match using your general football knowledge combined with the provided recent form data.

League: ${league}
Home: ${homeTeam}
Away: ${awayTeam}

Recent form data:
${historyContext}

Consider: team quality, home advantage, current form, and head-to-head history.

Respond ONLY with a JSON object in this exact format (no other text):
{"home": 2.50, "draw": 3.20, "away": 2.80, "reasoning": "One sentence explaining the key factors"}

All odds must be >= 1.05.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type');

  return JSON.parse(content.text.trim()) as MatchPrediction;
}

export async function getMatchPrediction(
  _matchId: string,
  homeTeam: string,
  awayTeam: string,
  league: string,
  historyContext: string
): Promise<MatchPrediction> {
  'use cache';
  cacheLife('hours'); // revalidate every hour
  return fetchPrediction(homeTeam, awayTeam, league, historyContext);
}
