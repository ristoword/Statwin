import { ConfigService } from '@nestjs/config';
import { OpenAIProvider } from './openai.provider';

function config(values: Record<string, unknown>): ConfigService {
  return {
    get: (key: string) => values[key],
  } as ConfigService;
}

describe('OpenAIProvider', () => {
  it('does not invent an analysis when the API key is missing', async () => {
    const provider = new OpenAIProvider(
      config({ 'ai.openaiApiKey': '', 'ai.defaultModel': 'gpt-4o', 'ai.maxTokens': 1024, 'ai.temperature': 0.7 }),
    );
    const result = await provider.analyzeMatch({ standings: { home: { points: 12 } } });
    expect(result.analysis).toContain('non configurato');
    expect(result.favorable).toEqual([]);
    expect(result.usedSources).toEqual(['standings']);
  });

  it('refuses to invent content when the context is empty', async () => {
    const provider = new OpenAIProvider(
      config({ 'ai.openaiApiKey': '', 'ai.defaultModel': 'gpt-4o' }),
    );
    const result = await provider.analyzeMatch({});
    expect(result.analysis).toContain('non inventa');
    expect(result.usedSources).toEqual([]);
    expect(result.predictedResult).toBeNull();
  });
});
