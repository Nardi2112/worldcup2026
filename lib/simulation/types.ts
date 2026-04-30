export type Team = {
  id: string
  name: string
  group: string
}

export type MatchResult = {
  home: number | null
  away: number | null
}

export type SimMatch = {
  id: string
  matchNumber: number
  homeTeamId: string
  awayTeamId: string
  result: MatchResult
  locked: boolean // תוצאת אמת
}

export type GroupStanding = {
  teamId: string
  name: string
  played: number
  won: number
  drawn: number
  lost: number
  gf: number // goals for
  ga: number // goals against
  gd: number // goal difference
  points: number
}

export type KnockoutSlot = {
  matchNumber: number
  homeTeamId: string | null
  awayTeamId: string | null
  homeLabel: string // e.g. "Winner Group A"
  awayLabel: string
  result: MatchResult
  winnerId: string | null
}
