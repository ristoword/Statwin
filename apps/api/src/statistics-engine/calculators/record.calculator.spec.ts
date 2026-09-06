import { calculateGoalAverage, calculateWinRate } from './record.calculator';

describe('record calculator', () => {
  it('returns 0 win rate when no matches', () => {
    expect(calculateWinRate({ wins: 0, draws: 0, losses: 0 })).toBe(0);
  });

  it('computes win rate', () => {
    expect(calculateWinRate({ wins: 2, draws: 1, losses: 1 })).toBe(0.5);
  });

  it('computes goal average', () => {
    expect(calculateGoalAverage(6, 3)).toBe(2);
  });
});
