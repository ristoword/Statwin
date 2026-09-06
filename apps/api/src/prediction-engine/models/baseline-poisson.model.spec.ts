import { BaselinePoissonModel } from './baseline-poisson.model';

describe('BaselinePoissonModel', () => {
  it('returns probabilities that sum to 1 and a disclaimer', () => {
    const model = new BaselinePoissonModel();
    const estimate = model.estimate({ homeStrength: 1.4, awayStrength: 1.1 });
    const total = estimate.outcomes.reduce((sum, item) => sum + item.probability, 0);
    expect(total).toBeCloseTo(1, 2);
    expect(estimate.disclaimer.length).toBeGreaterThan(10);
  });
});
