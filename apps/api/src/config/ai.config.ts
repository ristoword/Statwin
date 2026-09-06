import { registerAs } from '@nestjs/config';

export default registerAs('ai', () => ({
  openaiApiKey: process.env.OPENAI_API_KEY ?? '',
  defaultProvider: process.env.AI_DEFAULT_PROVIDER ?? 'openai',
  defaultModel: process.env.OPENAI_MODEL || process.env.AI_DEFAULT_MODEL || 'gpt-4o',
  maxTokens: Number(process.env.OPENAI_MAX_TOKENS ?? 1024),
  temperature: Number(process.env.OPENAI_TEMPERATURE ?? 0.7),
  schedulerToken: process.env.AI_SCHEDULER_TOKEN ?? '',
}));
