import { MatchStatus } from '@prisma/client';

export type ExternalCompetition = {
  externalId: string;
  name: string;
  country?: string;
  type?: string;
  seasonName: string;
  shortcut: string;
  seasonYear: number;
};

export type ExternalTeam = {
  externalId: string;
  name: string;
  shortName?: string;
  logo?: string;
  country?: string;
};

export type ExternalMatch = {
  externalId: string;
  competitionExternalId: string;
  seasonName: string;
  homeTeamExternalId: string;
  awayTeamExternalId: string;
  kickoff: Date;
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  venue?: string;
  events: ExternalMatchEvent[];
};

export type ExternalMatchEvent = {
  type: string;
  minute?: number;
  playerName?: string;
  teamExternalId?: string;
};

export type ExternalStanding = {
  teamExternalId: string;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
};
