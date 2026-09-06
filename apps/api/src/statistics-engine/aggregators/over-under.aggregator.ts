import { OutcomeRecord } from '../interfaces';

export function overUnderRate(outcomes: OutcomeRecord[], line: number) {
  if (!outcomes.length) {
    return { over: 0, under: 0, bothScored: 0 };
  }
  const over = outcomes.filter((item) => item.scored + item.conceded > line).length / outcomes.length;
  const under = outcomes.filter((item) => item.scored + item.conceded < line).length / outcomes.length;
  const bothScored =
    outcomes.filter((item) => item.scored > 0 && item.conceded > 0).length / outcomes.length;
  return { over, under, bothScored };
}
