'use client'

import { useMemo } from 'react'
import { GroupStanding } from '@/lib/simulation/types'
import { getBestThird } from '@/lib/simulation/groupLogic'
import { ROUND_OF_32, R16_PAIRS, QF_PAIRS, SF_PAIRS, getThirdPlaceSlots } from '@/lib/simulation/knockoutBracket'

type KR = { home: number | null; away: number | null }
type Props = {
  allStandings: Record<string, GroupStanding[]>
  teamMap: Record<string, string>
  knockoutResults: Record<number, KR>
  onKnockoutResult: (matchNum: number, side: 'home' | 'away', val: string) => void
}
type BMatch = {
  matchNum: number
  homeId: string | null; awayId: string | null
  homeLabel: string; awayLabel: string
  winnerId: string | null
}

// קיצורי שמות ארוכים
function shortName(name: string): string {
  const map: Record<string, string> = {
    'Bosnia and Herzegovina': 'Bosnia',
    'Democratic Republic of Congo': 'DR Congo',
    'Saudi Arabia': 'S. Arabia',
    'South Africa': 'S. Africa',
    'South Korea': 'S. Korea',
    'New Zealand': 'N. Zealand',
    'Ivory Coast': 'Côte d\'Ivoire',
    'Runner-up A': 'RU-A', 'Runner-up B': 'RU-B', 'Runner-up C': 'RU-C',
    'Runner-up D': 'RU-D', 'Runner-up E': 'RU-E', 'Runner-up F': 'RU-F',
    'Runner-up G': 'RU-G', 'Runner-up H': 'RU-H', 'Runner-up I': 'RU-I',
    'Runner-up J': 'RU-J', 'Runner-up K': 'RU-K', 'Runner-up L': 'RU-L',
  }
  return map[name] ?? name
}

export default function BracketView({ allStandings, teamMap, knockoutResults, onKnockoutResult }: Props) {
  const bestThirds = useMemo(() => getBestThird(allStandings), [allStandings])

  const matches = useMemo(() => {
    const slots: Record<string, string | null> = {}
    for (const [grp, standings] of Object.entries(allStandings)) {
      slots[`W_${grp}`] = standings[0]?.teamId ?? null
      slots[`RU_${grp}`] = standings[1]?.teamId ?? null
    }
    const thirdSlots = getThirdPlaceSlots(bestThirds)
    for (const [match, teamId] of Object.entries(thirdSlots)) {
      slots[`3RD_${match}`] = teamId
    }

    function w(mn: number, hId: string | null, aId: string | null): string | null {
      const r = knockoutResults[mn]
      if (!r || r.home === null || r.away === null || r.home === r.away) return null
      return r.home > r.away ? hId : aId
    }

    function mk(mn: number, hKey: string, aKey: string, hLabel: string, aLabel: string): BMatch {
      const homeId = slots[hKey] ?? null
      const awayId = slots[aKey] ?? null
      const winnerId = w(mn, homeId, awayId)
      slots[`W_M${mn}`] = winnerId
      return { matchNum: mn, homeId, awayId,
        homeLabel: shortName(homeId ? (teamMap[homeId] ?? hLabel) : hLabel),
        awayLabel: shortName(awayId ? (teamMap[awayId] ?? aLabel) : aLabel),
        winnerId }
    }

    function mkP(mn: number, a: number, b: number): BMatch {
      return mk(mn, `W_M${a}`, `W_M${b}`, `W${a}`, `W${b}`)
    }

    const r32map: Record<number, BMatch> = {}
    for (const m of ROUND_OF_32) {
      r32map[m.matchNum] = mk(m.matchNum, m.homeKey, m.awayKey, m.homeLabel, m.awayLabel)
    }

    const r16map: Record<number, BMatch> = {}
    for (const [mn, a, b] of R16_PAIRS) r16map[mn] = mkP(mn, a, b)

    const qfmap: Record<number, BMatch> = {}
    for (const [mn, a, b] of QF_PAIRS) qfmap[mn] = mkP(mn, a, b)

    const sfmap: Record<number, BMatch> = {}
    for (const [mn, a, b] of SF_PAIRS) sfmap[mn] = mkP(mn, a, b)

    const finalMatch = mkP(104, 101, 102)

    return { r32map, r16map, qfmap, sfmap, finalMatch }
  }, [allStandings, bestThirds, knockoutResults, teamMap])

  const { r32map, r16map, qfmap, sfmap, finalMatch } = matches

  // Bracket A: SF101 ← QF97,QF98 ← R16:89,90,93,94 ← R32:74,77,73,75,83,84,81,82
  // סדר R32 לפי זוגות: 74+77 (→89), 73+75 (→90), 83+84 (→93), 81+82 (→94)
  const bracketA = {
    r32: [74,77,73,75,83,84,81,82].map(n => r32map[n]),
    r16: [89,90,93,94].map(n => r16map[n]),
    qf:  [97,98].map(n => qfmap[n]),
    sf:  sfmap[101],
  }

  // Bracket B: SF102 ← QF99,QF100 ← R16:91,92,95,96 ← R32:76,78,79,80,86,88,85,87
  // סדר R32 לפי זוגות: 76+78 (→91), 79+80 (→92), 86+88 (→95), 85+87 (→96)
  const bracketB = {
    r32: [76,78,79,80,86,88,85,87].map(n => r32map[n]),
    r16: [91,92,95,96].map(n => r16map[n]),
    qf:  [99,100].map(n => qfmap[n]),
    sf:  sfmap[102],
  }

  return (
    <div className="space-y-8">
      <p className="text-xs text-gray-500 landscape:hidden">↔ Rotate for best view</p>

      {[
        { label: 'Bracket A', b: bracketA },
        { label: 'Bracket B', b: bracketB },
      ].map(({ label, b }) => (
        <div key={label}>
          <div className="text-sm font-bold text-green-400 mb-2">{label}</div>
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-0 min-w-max items-start">
              <StageCol label="R32" matches={b.r32} r={knockoutResults} onChange={onKnockoutResult} />
              <Connectors count={8} />
              <StageCol label="R16" matches={b.r16} r={knockoutResults} onChange={onKnockoutResult} topOffset={31} />
              <Connectors count={4} />
              <StageCol label="QF" matches={b.qf} r={knockoutResults} onChange={onKnockoutResult} topOffset={93} />
              <Connectors count={2} />
              <StageCol label="SF" matches={[b.sf]} r={knockoutResults} onChange={onKnockoutResult} topOffset={217} />
            </div>
          </div>
        </div>
      ))}

      {/* Final */}
      <div>
        <div className="text-sm font-bold text-yellow-400 mb-2">🏆 Final — #104</div>
        <MatchCard m={finalMatch} r={knockoutResults[104]} onChange={onKnockoutResult} />
        {finalMatch.winnerId && (
          <div className="mt-3 text-yellow-400 font-bold text-lg">
            🏆 {teamMap[finalMatch.winnerId]}
          </div>
        )}
      </div>
    </div>
  )
}

function StageCol({ label, matches, r, onChange, topOffset = 0 }: {
  label: string; matches: (BMatch | undefined)[]
  r: Record<number, KR>
  onChange: (mn: number, side: 'home' | 'away', val: string) => void
  topOffset?: number
}) {
  return (
    <div className="flex flex-col" style={{ paddingTop: topOffset }}>
      <div className="text-xs font-bold text-green-400 text-center mb-1 h-5">{label}</div>
      {matches.map((m, i) => m
        ? <MatchCard key={m.matchNum} m={m} r={r[m.matchNum]} onChange={onChange} />
        : <div key={i} className="h-[62px] w-36 my-0.5" />
      )}
    </div>
  )
}

function MatchCard({ m, r, onChange }: {
  m: BMatch; r?: KR
  onChange: (mn: number, side: 'home' | 'away', val: string) => void
}) {
  const hasTeams = !!(m.homeId && m.awayId)
  return (
    <div className={`bg-gray-900 border rounded-lg p-2 w-36 my-0.5 ${m.winnerId ? 'border-green-700' : 'border-gray-800'}`}>
      <div className="text-xs text-gray-600 mb-1">#{m.matchNum}</div>
      <div className="flex items-center gap-1 mb-0.5">
        <span className={`flex-1 text-xs truncate ${m.winnerId === m.homeId ? 'text-green-400 font-bold' : 'text-gray-300'}`}>
          {m.homeLabel}
        </span>
        <input type="number" min="0" max="20" disabled={!hasTeams}
          value={r?.home ?? ''}
          onChange={e => onChange(m.matchNum, 'home', e.target.value)}
          className="w-7 text-center bg-gray-800 border border-gray-700 rounded text-xs py-0.5 focus:outline-none focus:border-green-500 disabled:opacity-30"
        />
      </div>
      <div className="flex items-center gap-1">
        <span className={`flex-1 text-xs truncate ${m.winnerId === m.awayId ? 'text-green-400 font-bold' : 'text-gray-300'}`}>
          {m.awayLabel}
        </span>
        <input type="number" min="0" max="20" disabled={!hasTeams}
          value={r?.away ?? ''}
          onChange={e => onChange(m.matchNum, 'away', e.target.value)}
          className="w-7 text-center bg-gray-800 border border-gray-700 rounded text-xs py-0.5 focus:outline-none focus:border-green-500 disabled:opacity-30"
        />
      </div>
    </div>
  )
}

// קווי חיבור — כל זוג שכן מצטלב לשלב הבא
function Connectors({ count }: { count: number }) {
  const CARD = 62  // גובה כרטיס כולל margin
  const HEADER = 21
  const total = count * CARD + HEADER
  return (
    <svg width="16" height={total} className="flex-shrink-0">
      {Array.from({ length: count / 2 }).map((_, i) => {
        const t = HEADER + i * 2 * CARD + CARD / 2
        const b = t + CARD
        const mid = (t + b) / 2
        return (
          <g key={i}>
            <line x1="0" y1={t} x2="8" y2={t} stroke="#4b5563" strokeWidth="1.5" />
            <line x1="0" y1={b} x2="8" y2={b} stroke="#4b5563" strokeWidth="1.5" />
            <line x1="8" y1={t} x2="8" y2={b} stroke="#4b5563" strokeWidth="1.5" />
            <line x1="8" y1={mid} x2="16" y2={mid} stroke="#4b5563" strokeWidth="1.5" />
          </g>
        )
      })}
    </svg>
  )
}
