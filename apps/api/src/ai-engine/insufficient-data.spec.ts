import { hasArchiveContext, insufficientAiResponse } from './insufficient-data';

describe('insufficient AI context', () => {
  it('treats sport-only payloads as empty archive', () => {
    expect(hasArchiveContext({ sport: 'tennis' })).toBe(false);
    expect(hasArchiveContext({ sport: 'basketball', eventId: 'missing' })).toBe(false);
  });

  it('accepts real archive fields', () => {
    expect(hasArchiveContext({ match: { homeTeam: 'A', awayTeam: 'B' } })).toBe(true);
    expect(hasArchiveContext({ statistics: { form: ['W'] } })).toBe(true);
  });

  it('never invents a predicted score', () => {
    const payload = insufficientAiResponse({ sport: 'tennis', eventId: 'evt-1' });
    expect(payload.layer).toBe('AI_ANALYSIS');
    expect(payload.insufficient).toBe(true);
    expect(payload.report.content.predictedResult).toBeNull();
    expect(payload.report.content.analysis).toContain('non inventa');
  });
});
