export interface Sport {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

export interface MatchBase {
  id: string;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  status: string;
}
