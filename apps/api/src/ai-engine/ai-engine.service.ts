import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';
import { AppPlan } from '../common/enums/roles.enum';
import { hasMinPlan } from '../subscriptions/plan-limits';
import { SPORT_CATALOG } from '../sports/sport-catalog';
import { hasArchiveContext, insufficientAiResponse } from './insufficient-data';
import { MatchContextBuilder, toPublicReport } from './match-context.builder';
import { AIContext, AIProvider, AIReportResult } from './providers/ai-provider';

export const AI_PROVIDER = Symbol('AI_PROVIDER');

@Injectable()
export class AiEngineService {
  private readonly logger = new Logger(AiEngineService.name);

  constructor(
    @Inject(AI_PROVIDER) private readonly provider: AIProvider,
    private readonly prisma: PrismaService,
    private readonly contextBuilder: MatchContextBuilder,
  ) {}

  status() {
    return {
      layer: 'AI_ANALYSIS',
      configured: this.provider.configured,
      provider: 'openai',
      note: 'L’AI legge tutti gli sport in archivio. Analizza solo DATI, STATISTICHE e PROBABILITÀ già presenti. Un risultato previsto è ANALISI AI, mai un DATO ufficiale.',
    };
  }

  async analyzeRequest(input: {
    matchId?: string;
    eventId?: string;
    sport?: string;
    context?: Record<string, unknown>;
    force?: boolean;
  }) {
    const archiveId = input.matchId || input.eventId;
    if (archiveId) {
      const match = await this.prisma.match.findUnique({
        where: { id: archiveId },
        include: { sport: true },
      });
      if (match) {
        return this.analyzeStoredMatch(match.id, { force: input.force });
      }
    }

    const context = { ...(input.context ?? {}) };
    if (input.sport && context.sport == null) context.sport = input.sport;
    if (archiveId && context.eventId == null) context.eventId = archiveId;

    if (!hasArchiveContext(context)) {
      return insufficientAiResponse({
        sport: input.sport,
        eventId: archiveId,
        missing: [
          input.sport ? `evento ${input.sport} in archivio` : 'evento in archivio',
          'DATI',
          'STATISTICHE',
          'PROBABILITÀ',
        ],
      });
    }

    const result = await this.provider.analyzeMatch(context);
    return {
      layer: 'AI_ANALYSIS',
      reused: false,
      insufficient: false,
      sport: input.sport ?? null,
      eventId: archiveId ?? null,
      matchId: null,
      ...result,
    };
  }

  analyzeMatch(context: AIContext) {
    return this.provider.analyzeMatch(context);
  }

  async layers(matchId: string, plan = 'FREE') {
    const full = await this.contextBuilder.layers(matchId);
    const canProb = hasMinPlan(plan, AppPlan.PREMIUM);
    const canAi = hasMinPlan(plan, AppPlan.PRO);
    return {
      ...full,
      access: { plan, probabilities: canProb, ai: canAi },
      probabilities: canProb
        ? full.probabilities
        : { layer: 'PROBABILITY', locked: true, requiredPlan: 'PREMIUM' },
      odds: canProb ? full.odds : { locked: true, requiredPlan: 'PREMIUM' },
      aiAnalysis: canAi
        ? full.aiAnalysis
        : { layer: 'AI_ANALYSIS', locked: true, requiredPlan: 'PRO' },
    };
  }

  async analyzeStoredMatch(matchId: string, options?: { force?: boolean }) {
    if (!options?.force) {
      const existing = await this.prisma.aIReport.findFirst({
        where: { matchId, createdAt: { gte: new Date(Date.now() - 12 * 60 * 60 * 1000) } },
        orderBy: { createdAt: 'desc' },
      });
      if (existing) {
        return {
          layer: 'AI_ANALYSIS',
          reused: true,
          matchId,
          report: toPublicReport(existing),
        };
      }
    }

    const context = await this.contextBuilder.contextForAi(matchId);
    const result = await this.provider.analyzeMatch(context);
    const saved = await this.persist(matchId, result);
    return {
      layer: 'AI_ANALYSIS',
      reused: false,
      matchId,
      report: toPublicReport(saved),
    };
  }

  async listReports(take = 50) {
    const reports = await this.prisma.aIReport.findMany({
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        match: { include: { homeTeam: true, awayTeam: true, competition: true, sport: true } },
      },
    });
    return {
      layer: 'AI_ANALYSIS',
      note: 'L’AI legge tutti gli sport in archivio. I report restano ANALISI AI, mai DATI ufficiali.',
      count: reports.length,
      items: reports.map((report) => ({
        ...toPublicReport(report),
        match: {
          id: report.match.id,
          home: report.match.homeTeam.name,
          away: report.match.awayTeam.name,
          kickoff: report.match.kickoff,
          competition: report.match.competition?.name ?? null,
          sport: report.match.sport
            ? { slug: report.match.sport.slug, name: report.match.sport.name }
            : null,
        },
      })),
    };
  }

  async listArchive() {
    const sports = await this.prisma.sport.findMany({
      include: { _count: { select: { matches: true } } },
    });
    const bySlug = new Map(sports.map((row) => [row.slug, row]));
    const grouped = await Promise.all(
      SPORT_CATALOG.map(async (item) => {
        const row = bySlug.get(item.slug);
        const matches = row
          ? await this.prisma.match.findMany({
              where: { sportId: row.id },
              include: { homeTeam: true, awayTeam: true, competition: true, sport: true },
              orderBy: { kickoff: 'desc' },
              take: 8,
            })
          : [];
        return {
          slug: item.slug,
          name: item.name,
          href: item.href,
          eventNoun: item.eventNoun,
          status: item.status,
          count: row?._count.matches ?? 0,
          items: matches.map((match) => ({
            id: match.id,
            kickoff: match.kickoff,
            status: match.status,
            homeTeam: { name: match.homeTeam.name },
            awayTeam: { name: match.awayTeam.name },
            competition: match.competition ? { name: match.competition.name } : null,
            sport: { slug: match.sport.slug, name: match.sport.name },
          })),
        };
      }),
    );
    return {
      layer: 'DATA',
      note: 'L’AI legge tutti gli sport in archivio. Senza DATI non scrive e non inventa punteggi.',
      sports: grouped,
    };
  }

  async generateDueReports(options?: { limit?: number }) {
    const limit = Math.min(options?.limit ?? 8, 15);
    const from = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const to = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const since = new Date(Date.now() - 12 * 60 * 60 * 1000);

    const matches = await this.prisma.match.findMany({
      where: {
        kickoff: { gte: from, lte: to },
        aiReports: { none: { createdAt: { gte: since } } },
      },
      orderBy: { kickoff: 'asc' },
      take: limit,
      select: { id: true },
    });

    const generated: string[] = [];
    const errors: Array<{ matchId: string; message: string }> = [];

    for (const match of matches) {
      try {
        await this.analyzeStoredMatch(match.id, { force: true });
        generated.push(match.id);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'errore sconosciuto';
        this.logger.warn(`AI report skip ${match.id}: ${message}`);
        errors.push({ matchId: match.id, message });
      }
    }

    return {
      layer: 'AI_ANALYSIS',
      generated: generated.length,
      matchIds: generated,
      skipped: errors.length,
      errors,
      note: 'Nessun risultato inventato. Analisi solo su eventi già in archivio, qualsiasi sport.',
    };
  }

  private persist(matchId: string, result: AIReportResult) {
    return this.prisma.aIReport.create({
      data: {
        matchId,
        type: result.type,
        content: {
          analysis: result.analysis,
          favorable: result.favorable,
          unfavorable: result.unfavorable,
          missingData: result.missingData ?? [],
          predictedResult: result.predictedResult ?? null,
          disclaimer: result.disclaimer,
          model: result.model,
          provider: result.provider,
        },
        sources: result.usedSources,
      },
    });
  }
}
