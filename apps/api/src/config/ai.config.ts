import { registerAs } from '@nestjs/config';

export default registerAs('ai', () => ({
  openaiApiKey: process.env.OPENAI_API_KEY ?? '',
  defaultProvider: process.env.AI_DEFAULT_PROVIDER ?? 'openai',
  defaultModel: process.env.AI_DEFAULT_MODEL ?? 'gpt-4o-mini',
}));
