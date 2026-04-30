import { THIRD_PLACE_TABLE } from './thirdPlaceTable'

export function getThirdPlaceSlots(
  qualifiedThirds: { teamId: string; fromGroup: string }[]
): Record<string, string> {
  if (qualifiedThirds.length < 8) return {}

  const groups = qualifiedThirds.map(t => t.fromGroup).sort().join('')
  const assignment = THIRD_PLACE_TABLE[groups]

  const matchKeys = ['M74','M77','M79','M80','M81','M82','M85','M87']
  const result: Record<string, string> = {}

  if (assignment) {
    // שיבוץ מדויק לפי טבלת פיפא
    for (let i = 0; i < matchKeys.length; i++) {
      const group = assignment[i]
      const third = qualifiedThirds.find(t => t.fromGroup === group)
      if (third) result[matchKeys[i]] = third.teamId
    }
  } else {
    // fallback: שיבוץ לפי סדר (לא מדויק אך מציג את הקבוצות)
    for (let i = 0; i < 8; i++) {
      result[matchKeys[i]] = qualifiedThirds[i].teamId
    }
  }

  return result
}

export const ROUND_OF_32 = [
  { matchNum: 73, homeLabel: 'Runner-up A', awayLabel: 'Runner-up B', homeKey: 'RU_A', awayKey: 'RU_B' },
  { matchNum: 74, homeLabel: 'Winner E',    awayLabel: '3rd place',   homeKey: 'W_E',  awayKey: '3RD_M74' },
  { matchNum: 75, homeLabel: 'Winner F',    awayLabel: 'Runner-up C', homeKey: 'W_F',  awayKey: 'RU_C' },
  { matchNum: 76, homeLabel: 'Winner C',    awayLabel: 'Runner-up F', homeKey: 'W_C',  awayKey: 'RU_F' },
  { matchNum: 77, homeLabel: 'Winner I',    awayLabel: '3rd place',   homeKey: 'W_I',  awayKey: '3RD_M77' },
  { matchNum: 78, homeLabel: 'Runner-up E', awayLabel: 'Runner-up I', homeKey: 'RU_E', awayKey: 'RU_I' },
  { matchNum: 79, homeLabel: 'Winner A',    awayLabel: '3rd place',   homeKey: 'W_A',  awayKey: '3RD_M79' },
  { matchNum: 80, homeLabel: 'Winner L',    awayLabel: '3rd place',   homeKey: 'W_L',  awayKey: '3RD_M80' },
  { matchNum: 81, homeLabel: 'Winner D',    awayLabel: '3rd place',   homeKey: 'W_D',  awayKey: '3RD_M81' },
  { matchNum: 82, homeLabel: 'Winner G',    awayLabel: '3rd place',   homeKey: 'W_G',  awayKey: '3RD_M82' },
  { matchNum: 83, homeLabel: 'Runner-up K', awayLabel: 'Runner-up L', homeKey: 'RU_K', awayKey: 'RU_L' },
  { matchNum: 84, homeLabel: 'Winner H',    awayLabel: 'Runner-up J', homeKey: 'W_H',  awayKey: 'RU_J' },
  { matchNum: 85, homeLabel: 'Winner B',    awayLabel: '3rd place',   homeKey: 'W_B',  awayKey: '3RD_M85' },
  { matchNum: 86, homeLabel: 'Winner J',    awayLabel: 'Runner-up H', homeKey: 'W_J',  awayKey: 'RU_H' },
  { matchNum: 87, homeLabel: 'Winner K',    awayLabel: '3rd place',   homeKey: 'W_K',  awayKey: '3RD_M87' },
  { matchNum: 88, homeLabel: 'Runner-up D', awayLabel: 'Runner-up G', homeKey: 'RU_D', awayKey: 'RU_G' },
]

export const R16_PAIRS: [number, number, number][] = [
  [89, 74, 77],
  [90, 73, 75],
  [91, 76, 78],
  [92, 79, 80],
  [93, 83, 84],
  [94, 81, 82],
  [95, 86, 88],
  [96, 85, 87],
]

export const QF_PAIRS: [number, number, number][] = [
  [97, 89, 90],
  [98, 93, 94],
  [99, 91, 92],
  [100, 95, 96],
]

export const SF_PAIRS: [number, number, number][] = [
  [101, 97, 98],
  [102, 99, 100],
]
