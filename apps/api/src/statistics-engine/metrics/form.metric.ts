import { FormWindow, OutcomeRecord } from '../interfaces';

export function formWindow(outcomes: OutcomeRecord[], lastN: number): FormWindow {
  const slice = outcomes.slice(-lastN);
  const results = slice.map((item) => {
    if (item.scored > item.conceded) return 'W' as const;
    if (item.scored === item.conceded) return 'D' as const;
    return 'L' as const;
  });
  const points = results.reduce((sum, result) => {
    if (result === 'W') return sum + 3;
    if (result === 'D') return sum + 1;
    return sum;
  }, 0);
  return { lastN, results, points };
}
