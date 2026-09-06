import { SimpleStatisticalModel } from './simple-statistical.model';

describe('SimpleStatisticalModel', () => {
  it('returns probabilities that sum to 1 and includes a disclaimer', () => {
    const model = new SimpleStatisticalModel();
    const estimate = model.estimate({
      homeWinRate: 0.6,
      awayWinRate: 0.3,
      homeFormPoints: 10,
      awayFormPoints: 6,
    });
    const total = estimate.outcomes.home + estimate.outcomes.draw + estimate.outcomes.away;
    expect(total).toBeCloseTo(1, 5);
    expect(estimate.disclaimer.length).toBeGreaterThan(10);
    expect(estimate.confidence).toBeLessThan(1);
  });
});
