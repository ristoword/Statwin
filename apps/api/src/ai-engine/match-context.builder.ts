import { Injectable, NotFoundException } from '@nestjs/common';
import { MatchStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma/prisma.service';
import { PredictionEngineService } from '../prediction-engine/prediction-engine.service';
import { StatisticsEngineService } from '../statistics-engine/statistics-engine.service';
import { AIContext } from './providers/ai-provider';

export type MatchLayers = {
  disclaimer: string;
  matchId: string;
  data: Record<string, unknown>;
  statistics: Record<string, unknown> | null;
  probabilities: Record<string, unknown> | null;
  odds: Record<string, unknown> | null;
  aiAnalysis: unknown;
};

const LAYERS_DISCLAIMER =
  'Distinzione obbligatoria: DATI / STATISTICHE / PROBABILITÀ / ANALISI AI. Le probabilità sono stime, non certezze. 18+. Nessuna vincita promessa.';

@Injectable()
export class MatchContextBuilder {
  constructor(
    private readonly prisma: PrismaService,
    private readonly predictions: PredictionEngineService,
    private readonly statistics: StatisticsEngineService,
  ) {}

  async requireMatch(matchId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        sport: true,
        homeTeam: true,
        awayTeam: true,
        competition: true,
        season: true,
        events: true,
        lineups: { include: { player: true, team: true } },
        odds: { include: { bookmaker: true, market: true } },
        predictions: true,
        aiReports: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
    if (!match) {
      throw new NotFoundException('Partita non trovata');
    }
    return match;
  }

  async layers(matchId: string): Promise<MatchLayers> {
    const match = await this.requireMatch(matchId);
    const extras = await this.extras(match);
    const data = this.dataLayer(match);
    const statistics = this.statisticsLayer(extras);
    const probabilities = this.probabilitiesLayer(match, extras);
    return {
      disclaimer: LAYERS_DISCLAIMER,
      matchId: match.id,
      data,
      statistics,
      probabilities,
      odds: this.oddsLayer(match),
      aiAnalysis: match.aiReports[0]
        ? { layer: 'AI_ANALYSIS', ...toPublicReport(match.aiReports[0]) }
        : null,
    };
  }

  async contextForAi(matchId: string): Promise<AIContext> {
    const match = await this.requireMatch(matchId);
    const extras = await this.extras(match);
    const context: AIContext = {};
    const data = this.dataLayer(match);
    const statistics = this.statisticsLayer(extras);
    const probabilities = this.probabilitiesLayer(match, extras);

    context.match = data;
    if (statistics) context.statistics = statistics;
    if (extras.standings) context.standings = extras.standings;
    if (extras.form) context.form = extras.form;
    if (extras.headToHead) context.headToHead = extras.headToHead;
    if (extras.homeAway) context.homeAway = extras.homeAway;
    if (extras.teamStats) context.history = extras.teamStats;
    if (probabilities) context.probabilities = probabilities;
    if (match.odds.length > 0) {
      context.odds = match.odds.map((odd) => ({
        selection: odd.selection,
        price: odd.price,
        bookmaker: odd.bookmaker?.name,
        market: odd.market?.name,
        capturedAt: odd.capturedAt,
      }));
    }
    if (match.lineups.length > 0) {
      context.lineups = match.lineups.map((row) => ({
        team: row.team.name,
        player: row.player.name,
        position: row.position,
        isStarter: row.isStarter,
      }));
    }
    if (match.events.length > 0) {
      context.events = match.events.map((event) => ({
        type: event.type,
        minute: event.minute,
        teamSide: event.teamSide,
        payload: event.payload,
      }));
    }
    return context;
  }

  private dataLayer(match: Awaited<ReturnType<MatchContextBuilder['requireMatch']>>) {
    const hasScore = match.homeScore != null && match.awayScore != null;
    return {
      layer: 'DATA',
      id: match.id,
      sport: match.sport ? { slug: match.sport.slug, name: match.sport.name } : null,
      competition: match.competition?.name ?? null,
      season: match.season?.name ?? null,
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      kickoff: match.kickoff,
      status: match.status,
      venue: match.venue ?? null,
      score: hasScore ? { home: match.homeScore, away: match.awayScore } : null,
    };
  }

  private oddsLayer(match: Awaited<ReturnType<MatchContextBuilder['requireMatch']>>) {
    if (match.odds.length === 0) return null;
    return {
      layer: 'DATA',
      disclaimer: 'Quote archiviate dal provider. Non sono inventate e non sono un consiglio di scommessa.',
      items: match.odds.map((odd) => ({
        bookmaker: odd.bookmaker?.name ?? 'n/d',
        market: odd.market?.name ?? odd.market?.slug ?? 'n/d',
        selection: odd.selection,
        price: odd.price,
        capturedAt: odd.capturedAt,
      })),
    };
  }

  private statisticsLayer(extras: Extras): Record<string, unknown> | null {
    const payload: Record<string, unknown> = { layer: 'STATISTICS' };
    if (extras.standings) payload.standings = extras.standings;
    if (extras.form) payload.form = extras.form;
    if (extras.headToHead) payload.headToHead = extras.headToHead;
    if (extras.homeAway) payload.homeAway = extras.homeAway;
    if (extras.teamStats) payload.teamStats = extras.teamStats;
    return Object.keys(payload).length > 1 ? payload : null;
  }

  private probabilitiesLayer(
    match: Awaited<ReturnType<MatchContextBuilder['requireMatch']>>,
    extras: Extras,
  ): Record<string, unknown> | null {
    if (match.predictions.length > 0) {
      const stored: Record<string, unknown> = {
        layer: 'PROBABILITY',
        source: 'stored',
        items: match.predictions.map((item) => ({
          market: item.market,
          selection: item.selection,
          probability: item.probability,
          disclaimer: item.disclaimer,
        })),
      };
      if (extras.computedProbability?.predictedScore) {
        stored.predictedScore = extras.computedProbability.predictedScore;
      }
      if (extras.computedProbability?.overUnder) stored.overUnder = extras.computedProbability.overUnder;
      if (extras.computedProbability?.btts) stored.btts = extras.computedProbability.btts;
      if (extras.computedProbability?.impliedOddsDisclaimer) {
        stored.impliedOddsDisclaimer = extras.computedProbability.impliedOddsDisclaimer;
      }
      if (extras.computedProbability?.outcomes) stored.modelOutcomes = extras.computedProbability.outcomes;
      return stored;
    }
    if (extras.computedProbability) {
      return { layer: 'PROBABILITY', source: 'model', ...extras.computedProbability };
    }
    return null;
  }

  private async extras(match: Awaited<ReturnType<MatchContextBuilder['requireMatch']>>): Promise<Extras> {
    const [homeStanding, awayStanding, homeStats, awayStats, homeForm, awayForm, h2h] = await Promise.all([
      this.standingFor(match.homeTeamId, match.seasonId),
      this.standingFor(match.awayTeamId, match.seasonId),
      this.teamStats(match.homeTeamId),
      this.teamStats(match.awayTeamId),
      this.form(match.homeTeamId, match.homeTeam.name),
      this.form(match.awayTeamId, match.awayTeam.name),
      this.headToHead(match.homeTeamId, match.awayTeamId, match.homeTeam.name, match.awayTeam.name),
    ]);

    const extras: Extras = {};
    if (homeStanding || awayStanding) {
      extras.standings = {
        home: homeStanding,
        away: awayStanding,
      };
    }
    if (homeForm || awayForm) {
      extras.form = { home: homeForm, away: awayForm };
    }
    if (h2h) extras.headToHead = h2h;
    if (homeStanding || awayStanding) {
      extras.homeAway = {
        home: homeStanding
          ? this.statistics.summarize(
              { wins: homeStanding.won, draws: homeStanding.drawn, losses: homeStanding.lost },
              homeStanding.goalsFor,
              homeStanding.goalsAgainst,
            )
          : null,
        away: awayStanding
          ? this.statistics.summarize(
              { wins: awayStanding.won, draws: awayStanding.drawn, losses: awayStanding.lost },
              awayStanding.goalsFor,
              awayStanding.goalsAgainst,
            )
          : null,
      };
    }
    if (homeStats.length || awayStats.length) {
      extras.teamStats = { home: homeStats, away: awayStats };
    }
    if (homeStanding && awayStanding && homeStanding.played > 0 && awayStanding.played > 0) {
      extras.computedProbability = this.predictions.estimate({
        homeStrength: pointsPerGame(homeStanding),
        awayStrength: pointsPerGame(awayStanding),
      });
    }
    return extras;
  }

  private async standingFor(teamId: string, seasonId: string | null) {
    if (!seasonId) return null;
    const row = await this.prisma.standing.findUnique({
      where: { seasonId_teamId: { seasonId, teamId } },
    });
    if (!row) return null;
    return {
      position: row.position,
      played: row.played,
      won: row.won,
      drawn: row.drawn,
      lost: row.lost,
      goalsFor: row.goalsFor,
      goalsAgainst: row.goalsAgainst,
      points: row.points,
    };
  }

  private async teamStats(teamId: string) {
    const rows = await this.prisma.teamStatistic.findMany({
      where: { teamId },
      take: 20,
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((row) => ({
      metric: row.metric,
      value: row.value,
      context: row.context,
      seasonKey: row.seasonKey,
    }));
  }

  private async form(teamId: string, teamName: string) {
    const matches = await this.prisma.match.findMany({
      where: {
        OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
        status: MatchStatus.FINISHED,
        homeScore: { not: null },
        awayScore: { not: null },
      },
      orderBy: { kickoff: 'desc' },
      take: 5,
      include: { homeTeam: true, awayTeam: true },
    });
    if (matches.length === 0) return null;
    return {
      team: teamName,
      last: matches.map((item) => {
        const home = item.homeTeamId === teamId;
        const gf = home ? item.homeScore! : item.awayScore!;
        const ga = home ? item.awayScore! : item.homeScore!;
        const result = gf > ga ? 'W' : gf < ga ? 'L' : 'D';
        return {
          opponent: home ? item.awayTeam.name : item.homeTeam.name,
          score: `${gf}-${ga}`,
          result,
          kickoff: item.kickoff,
        };
      }),
    };
  }

  private async headToHead(homeTeamId: string, awayTeamId: string, homeName: string, awayName: string) {
    const stored = await this.prisma.headToHead.findUnique({
      where: { homeTeamId_awayTeamId: { homeTeamId, awayTeamId } },
    });
    const matches = await this.prisma.match.findMany({
      where: {
        OR: [
          { homeTeamId, awayTeamId },
          { homeTeamId: awayTeamId, awayTeamId: homeTeamId },
        ],
        status: MatchStatus.FINISHED,
        homeScore: { not: null },
        awayScore: { not: null },
      },
      orderBy: { kickoff: 'desc' },
      take: 10,
      include: { homeTeam: true, awayTeam: true },
    });
    if (!stored && matches.length === 0) return null;
    return {
      pairs: stored
        ? { played: stored.played, homeWins: stored.homeWins, draws: stored.draws, awayWins: stored.awayWins }
        : null,
      recent: matches.map((item) => ({
        home: item.homeTeam.name,
        away: item.awayTeam.name,
        score: `${item.homeScore}-${item.awayScore}`,
        kickoff: item.kickoff,
      })),
      sides: { home: homeName, away: awayName },
    };
  }
}

type Extras = {
  standings?: unknown;
  form?: unknown;
  headToHead?: unknown;
  homeAway?: unknown;
  teamStats?: unknown;
  computedProbability?: {
    predictedScore?: unknown;
    overUnder?: unknown;
    btts?: unknown;
    outcomes?: unknown;
    impliedOddsDisclaimer?: unknown;
    [key: string]: unknown;
  };
};

export function toPublicReport(report: { id: string; type: string; content: unknown; sources: unknown; createdAt: Date }) {
  return {
    id: report.id,
    type: report.type,
    content: report.content,
    sources: report.sources,
    createdAt: report.createdAt,
  };
}

function pointsPerGame(row: { points: number; played: number }) {
  return row.played > 0 ? row.points / (row.played * 3) : 0.33;
}
