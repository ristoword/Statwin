import { BaselinePoissonModel } from './baseline-poisson.model';

describe('BaselinePoissonModel', () => {
  it('returns probabilities that sum to 1 and a disclaimer', () => {
    const model = new BaselinePoissonModel();
    const estimate = model.estimate({ homeStrength: 1.4, awayStrength: 1.1 });
    const total = estimate.outcomes.reduce((sum, item) => sum + item.probability, 0);
    expect(total).toBeCloseTo(1, 2);
    expect(estimate.disclaimer.length).toBeGreaterThan(10);
    expect(estimate.predictedScore.home).toBeGreaterThanOrEqual(0);
    expect(estimate.predictedScore.away).toBeGreaterThanOrEqual(0);
    expect(estimate.predictedScore.kind).toBe('model');
    expect(estimate.overUnder.some((row) => row.line === 2.5)).toBe(true);
    expect(estimate.btts.yes + estimate.btts.no).toBeCloseTo(1, 2);
    expect(estimate.outcomes[0].impliedOdds).toBeGreaterThan(1);
  });
});
