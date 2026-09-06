import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIContext, AIProvider, AIReportResult } from './ai-provider';

const DISCLAIMER =
  'Analisi AI basata solo sui dati forniti. Non inventa informazioni. Non è una previsione certa né un consiglio di scommessa.';

@Injectable()
export class OpenAIProvider implements AIProvider {
  constructor(private readonly config: ConfigService) {}

  async analyzeMatch(context: AIContext): Promise<AIReportResult> {
    const usedSources = Object.entries(context)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key]) => key);

    const apiKey = this.config.get<string>('ai.openaiApiKey');
    if (!apiKey) {
      return {
        type: 'match-analysis',
        analysis:
          usedSources.length === 0
            ? 'Nessun dato disponibile. L’AI non inventa informazioni mancanti.'
            : `Provider OpenAI non configurato. Fonti ricevute: ${usedSources.join(', ')}.`,
        favorable: [],
        unfavorable: [],
        usedSources,
        disclaimer: DISCLAIMER,
      };
    }

    return {
      type: 'match-analysis',
      analysis:
        'Chiamata OpenAI predisposta via adapter. In questa fase la generazione completa è disabilitata fino a configurazione esplicita del prompt e dei guardrail.',
      favorable: [],
      unfavorable: [],
      usedSources,
      disclaimer: DISCLAIMER,
    };
  }
}
