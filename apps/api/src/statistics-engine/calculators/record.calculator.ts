export type ResultRecord = {
  wins: number;
  draws: number;
  losses: number;
};

export function calculateWinRate(record: ResultRecord): number {
  const total = record.wins + record.draws + record.losses;
  if (total === 0) {
    return 0;
  }
  return record.wins / total;
}

export function calculateGoalAverage(goalsFor: number, played: number): number {
  if (played === 0) {
    return 0;
  }
  return goalsFor / played;
}
