export interface AIProviderContract {
  generate(prompt: string, context: Record<string, unknown>): Promise<string>;
}
