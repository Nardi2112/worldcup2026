import { SimMatch, GroupStanding } from './types'

export function calcGroupStandings(
  groupTeamIds: string[],
  teamNames: Record<string, string>,
  matches: SimMatch[]
): GroupStanding[] {
  const standings: Record<string, GroupStanding> = {}

  for (const id of groupTeamIds) {
    standings[id] = {
      teamId: id, name: teamNames[id] ?? id,
      played: 0, won: 0, drawn: 0, lost: 0,
      gf: 0, ga: 0, gd: 0, points: 0
    }
  }

  for (const m of matches) {
    const { home, away } = m.result
    if (home === null || away === null) continue
    const h = standings[m.homeTeamId]
    const a = standings[m.awayTeamId]
    if (!h || !a) continue

    h.played++; a.played++
    h.gf += home; h.ga += away; h.gd += home - away
    a.gf += away; a.ga += home; a.gd += away - home

    if (home > away) { h.won++; h.points += 3; a.lost++ }
    else if (home < away) { a.won++; a.points += 3; h.lost++ }
    else { h.drawn++; h.points++; a.drawn++; a.points++ }
  }

  return sortStandings(Object.values(standings), matches)
}

function sortStandings(teams: GroupStanding[], matches: SimMatch[]): GroupStanding[] {
  return teams.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.gd !== a.gd) return b.gd - a.gd
    if (b.gf !== a.gf) return b.gf - a.gf
    // head to head
    const h2h = getH2H([a.teamId, b.teamId], matches)
    const aH2H = h2h[a.teamId]
    const bH2H = h2h[b.teamId]
    if (bH2H.points !== aH2H.points) return bH2H.points - aH2H.points
    if (bH2H.gd !== aH2H.gd) return bH2H.gd - aH2H.gd
    if (bH2H.gf !== aH2H.gf) return bH2H.gf - aH2H.gf
    return 0
  })
}

function getH2H(teamIds: string[], matches: SimMatch[]) {
  const stats: Record<string, { points: number; gd: number; gf: number }> = {}
  for (const id of teamIds) stats[id] = { points: 0, gd: 0, gf: 0 }

  for (const m of matches) {
    const { home, away } = m.result
    if (home === null || away === null) continue
    if (!teamIds.includes(m.homeTeamId) || !teamIds.includes(m.awayTeamId)) continue

    stats[m.homeTeamId].gf += home
    stats[m.homeTeamId].gd += home - away
    stats[m.awayTeamId].gf += away
    stats[m.awayTeamId].gd += away - home

    if (home > away) stats[m.homeTeamId].points += 3
    else if (home < away) stats[m.awayTeamId].points += 3
    else { stats[m.homeTeamId].points++; stats[m.awayTeamId].points++ }
  }
  return stats
}

// בחירת 8 הטובים מהשלישיים
export function getBestThird(
  allGroupStandings: Record<string, GroupStanding[]>
): { teamId: string; fromGroup: string; standing: GroupStanding }[] {
  const thirds = Object.entries(allGroupStandings).map(([group, standings]) => ({
    teamId: standings[2]?.teamId ?? '',
    fromGroup: group,
    standing: standings[2]
  })).filter(t => t.standing)

  return thirds
    .sort((a, b) => {
      if (b.standing.points !== a.standing.points) return b.standing.points - a.standing.points
      if (b.standing.gd !== a.standing.gd) return b.standing.gd - a.standing.gd
      if (b.standing.gf !== a.standing.gf) return b.standing.gf - a.standing.gf
      return 0
    })
    .slice(0, 8)
}
