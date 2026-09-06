import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';
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
      note: 'L’AI analizza solo DATI, STATISTICHE e PROBABILITÀ già in archivio. Un risultato previsto è ANALISI AI, mai un DATO ufficiale.',
    };
  }

  analyzeMatch(context: AIContext) {
    return this.provider.analyzeMatch(context);
  }

  layers(matchId: string) {
    return this.contextBuilder.layers(matchId);
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
        match: { include: { homeTeam: true, awayTeam: true, competition: true } },
      },
    });
    return {
      layer: 'AI_ANALYSIS',
      count: reports.length,
      items: reports.map((report) => ({
        ...toPublicReport(report),
        match: {
          id: report.match.id,
          home: report.match.homeTeam.name,
          away: report.match.awayTeam.name,
          kickoff: report.match.kickoff,
          competition: report.match.competition?.name ?? null,
        },
      })),
    };
  }

  async generateDueReports(options?: { limit?: number }) {
    const limit = Math.min(options?.limit ?? 8, 15);
    const from = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const to = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const since = new Date(Date.now() - 12 * 60 * 60 * 1000);

    const matches = await this.prisma.match.findMany({
      where: {
        sport: { slug: 'football' },
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
      note: 'Nessun risultato inventato. Analisi solo su partite già in archivio.',
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
