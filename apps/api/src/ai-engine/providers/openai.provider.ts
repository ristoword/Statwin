import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MATCH_ANALYSIS_SYSTEM_PROMPT } from '../prompts/match-analysis.prompt';
import { AIContext, AIPredictedResult, AIProvider, AIReportResult } from './ai-provider';

const DISCLAIMER =
  'Analisi AI basata solo sui DATI, STATISTICHE e PROBABILITÀ già in archivio. Non inventa informazioni. Non è una previsione certa né un consiglio di scommessa. 18+.';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

type OpenAIChatResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

@Injectable()
export class OpenAIProvider implements AIProvider {
  private readonly logger = new Logger(OpenAIProvider.name);

  constructor(private readonly config: ConfigService) {}

  get configured(): boolean {
    return Boolean(this.config.get<string>('ai.openaiApiKey'));
  }

  async analyzeMatch(context: AIContext): Promise<AIReportResult> {
    const usedSources = Object.entries(context)
      .filter(([, value]) => value !== undefined && value !== null && !isEmpty(value))
      .map(([key]) => key);

    const apiKey = this.config.get<string>('ai.openaiApiKey') ?? '';
    const model = this.config.get<string>('ai.defaultModel') ?? 'gpt-4o';
    const maxTokens = this.config.get<number>('ai.maxTokens') ?? 1024;
    const temperature = this.config.get<number>('ai.temperature') ?? 0.7;

    if (!apiKey) {
      return {
        type: 'match-analysis',
        analysis:
          usedSources.length === 0
            ? 'Nessun dato disponibile in archivio. L’AI non inventa informazioni mancanti.'
            : `Provider OpenAI non configurato. Fonti ricevute (non analizzate): ${usedSources.join(', ')}.`,
        favorable: [],
        unfavorable: [],
        missingData: ['OPENAI_API_KEY'],
        predictedResult: null,
        usedSources,
        disclaimer: DISCLAIMER,
        provider: 'openai',
        model,
      };
    }

    if (usedSources.length === 0) {
      return {
        type: 'match-analysis',
        analysis: 'Nessun DATO, STATISTICA o PROBABILITÀ in archivio per questa richiesta. L’AI non inventa informazioni.',
        favorable: [],
        unfavorable: [],
        missingData: ['context'],
        predictedResult: null,
        usedSources,
        disclaimer: DISCLAIMER,
        provider: 'openai',
        model,
      };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45_000);

    try {
      const response = await fetch(OPENAI_URL, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          temperature,
          max_tokens: maxTokens,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: MATCH_ANALYSIS_SYSTEM_PROMPT },
            {
              role: 'user',
              content: `Contesto da archivio STATWIN (non inventare nulla fuori da questo JSON):\n${JSON.stringify(context)}`,
            },
          ],
        }),
      });

      if (!response.ok) {
        await safeText(response);
        this.logger.warn(`OpenAI HTTP ${response.status}`);
        throw new ServiceUnavailableException(`OpenAI non disponibile (HTTP ${response.status}). Riprova più tardi.`);
      }

      const payload = (await response.json()) as OpenAIChatResponse;
      const content = payload.choices?.[0]?.message?.content ?? '';
      const parsed = parseModelJson(content);

      return {
        type: 'match-analysis',
        analysis: parsed.analysis || 'L’AI non ha prodotto una sintesi utilizzabile.',
        favorable: parsed.favorable,
        unfavorable: parsed.unfavorable,
        missingData: parsed.missingData,
        predictedResult: parsed.predictedResult,
        usedSources,
        disclaimer: DISCLAIMER,
        provider: 'openai',
        model,
      };
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }
      this.logger.warn(`OpenAI call failed: ${error instanceof Error ? error.message : 'unknown'}`);
      throw new ServiceUnavailableException('Chiamata OpenAI non riuscita. Nessuna analisi inventata.');
    } finally {
      clearTimeout(timer);
    }
  }
}

function isEmpty(value: unknown): boolean {
  if (Array.isArray(value)) return value.length === 0;
  if (value && typeof value === 'object') return Object.keys(value).length === 0;
  if (typeof value === 'string') return value.trim().length === 0;
  return false;
}

function parseModelJson(content: string): {
  analysis: string;
  favorable: string[];
  unfavorable: string[];
  missingData: string[];
  predictedResult: AIPredictedResult | null;
} {
  const stripped = content.replace(/```json|```/g, '').trim();
  try {
    const json = JSON.parse(stripped) as Record<string, unknown>;
    return {
      analysis: typeof json.analysis === 'string' ? json.analysis : stripped,
      favorable: asStringArray(json.favorable),
      unfavorable: asStringArray(json.unfavorable),
      missingData: asStringArray(json.missingData),
      predictedResult: parsePredictedResult(json.predictedResult),
    };
  } catch {
    return {
      analysis: stripped || 'Risposta AI non interpretabile.',
      favorable: [],
      unfavorable: [],
      missingData: [],
      predictedResult: null,
    };
  }
}

function parsePredictedResult(value: unknown): AIPredictedResult | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  const scoreHome = asScore(row.scoreHome);
  const scoreAway = asScore(row.scoreAway);
  if (scoreHome == null || scoreAway == null) return null;
  const rawOutcome = row.outcome;
  const outcome =
    rawOutcome === 'HOME' || rawOutcome === 'DRAW' || rawOutcome === 'AWAY'
      ? rawOutcome
      : scoreHome > scoreAway
        ? 'HOME'
        : scoreHome < scoreAway
          ? 'AWAY'
          : 'DRAW';
  const confidence =
    row.confidence === 'low' || row.confidence === 'medium' || row.confidence === 'high'
      ? row.confidence
      : 'low';
  return {
    outcome,
    scoreHome,
    scoreAway,
    confidence,
    rationale: typeof row.rationale === 'string' && row.rationale.trim() ? row.rationale.trim().slice(0, 400) : null,
  };
}

function asScore(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const score = Math.round(value);
  if (score < 0 || score > 6) return null;
  return score;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

async function safeText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return '';
  }
}
