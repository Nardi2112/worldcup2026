// Script to generate realistic predictions for fake users based on FIFA rankings
// Run with: node scripts/generate-fake-predictions.js

// FIFA Rankings for all 48 World Cup teams
const FIFA_RANKINGS = {
  'Spain': 1, 'Argentina': 2, 'France': 3, 'England': 4, 'Brazil': 5,
  'Portugal': 6, 'Netherlands': 7, 'Belgium': 8, 'Germany': 9, 'Croatia': 10,
  'Morocco': 11, 'Colombia': 13, 'USA': 14, 'Mexico': 15, 'Uruguay': 16,
  'Switzerland': 17, 'Japan': 18, 'Senegal': 19, 'Iran': 20, 'South Korea': 22,
  'Ecuador': 23, 'Austria': 24, 'Australia': 26, 'Canada': 27, 'Norway': 29,
  'Panama': 30, 'Egypt': 34, 'Algeria': 35, 'Scotland': 36, 'Paraguay': 39,
  'Tunisia': 40, 'Ivory Coast': 42, 'Uzbekistan': 50, 'Qatar': 51,
  'Saudi Arabia': 60, 'South Africa': 61, 'Jordan': 66, 'Cape Verde': 68,
  'Ghana': 72, 'Curacao': 82, 'Haiti': 84, 'New Zealand': 86,
  'Sweden': 43, 'Czechia': 44, 'Turkiye': 25, 'DR Congo': 56, 'Iraq': 58,
  'Bosnia and Herzegovina': 71
}

// Strength score: higher = stronger (inverse of ranking)
function strength(team) {
  const rank = FIFA_RANKINGS[team] || 100
  return Math.max(1, 100 - rank)
}

// Predict score based on team strengths + noise level
function predictScore(homeTeam, awayTeam, noiseLevel = 0.3, upsetBias = 0) {
  const homeStr = strength(homeTeam) * (1 + (Math.random() - 0.5) * noiseLevel)
  const awayStr = strength(awayTeam) * (1 + (Math.random() - 0.5) * noiseLevel)
  
  // Base expected goals (avg ~1.3 per team in WC)
  const totalGoals = 1.5 + Math.random() * 2
  const ratio = homeStr / (homeStr + awayStr)
  
  let homeGoals, awayGoals
  
  if (upsetBias > 0 && Math.random() < upsetBias) {
    // upset: weaker team wins
    homeGoals = Math.round(totalGoals * (1 - ratio))
    awayGoals = Math.round(totalGoals * ratio)
  } else {
    homeGoals = Math.round(totalGoals * ratio)
    awayGoals = Math.round(totalGoals * (1 - ratio))
  }
  
  return [Math.max(0, homeGoals), Math.max(0, awayGoals)]
}

// 8 fake users with different prediction styles
const USERS = [
  { id: '11111111-0000-0000-0000-000000000001', name: 'David K.',   noise: 0.1, upset: 0.05 }, // follows rankings closely
  { id: '11111111-0000-0000-0000-000000000002', name: 'Sarah M.',   noise: 0.3, upset: 0.10 }, // moderate noise
  { id: '11111111-0000-0000-0000-000000000003', name: 'Yoni B.',    noise: 0.2, upset: 0.25 }, // likes upsets
  { id: '11111111-0000-0000-0000-000000000004', name: 'Noa R.',     noise: 0.4, upset: 0.08 }, // high variance
  { id: '11111111-0000-0000-0000-000000000005', name: 'Avi L.',     noise: 0.15, upset: 0.05 }, // analytical
  { id: '11111111-0000-0000-0000-000000000006', name: 'Maya T.',    noise: 0.5, upset: 0.20 }, // random
  { id: '11111111-0000-0000-0000-000000000007', name: 'Ron S.',     noise: 0.2, upset: 0.15 }, // balanced
  { id: '11111111-0000-0000-0000-000000000008', name: 'Tali G.',    noise: 0.35, upset: 0.12 }, // slightly random
]

// We need the actual match IDs and team names from the DB
// This script generates the SQL INSERT statements

// Match data (from our seed - match UUIDs and team names)
const MATCHES = [
  // Group A
  { id: '00000000-0000-0000-0000-000000000001', home: 'Mexico', away: 'South Africa' },
  { id: '00000000-0000-0000-0000-000000000002', home: 'South Korea', away: 'Czechia' },
  { id: '00000000-0000-0000-0000-000000000003', home: 'Czechia', away: 'South Africa' },
  { id: '00000000-0000-0000-0000-000000000004', home: 'Mexico', away: 'South Korea' },
  { id: '00000000-0000-0000-0000-000000000005', home: 'Czechia', away: 'Mexico' },
  { id: '00000000-0000-0000-0000-000000000006', home: 'South Africa', away: 'South Korea' },
  // Group B
  { id: '00000000-0000-0000-0000-000000000007', home: 'Canada', away: 'Bosnia and Herzegovina' },
  { id: '00000000-0000-0000-0000-000000000008', home: 'Qatar', away: 'Switzerland' },
  { id: '00000000-0000-0000-0000-000000000009', home: 'Switzerland', away: 'Bosnia and Herzegovina' },
  { id: '00000000-0000-0000-0000-000000000010', home: 'Canada', away: 'Qatar' },
  { id: '00000000-0000-0000-0000-000000000011', home: 'Switzerland', away: 'Canada' },
  { id: '00000000-0000-0000-0000-000000000012', home: 'Bosnia and Herzegovina', away: 'Qatar' },
  // Group C
  { id: '00000000-0000-0000-0000-000000000013', home: 'Brazil', away: 'Morocco' },
  { id: '00000000-0000-0000-0000-000000000014', home: 'Haiti', away: 'Scotland' },
  { id: '00000000-0000-0000-0000-000000000015', home: 'Scotland', away: 'Morocco' },
  { id: '00000000-0000-0000-0000-000000000016', home: 'Brazil', away: 'Haiti' },
  { id: '00000000-0000-0000-0000-000000000017', home: 'Scotland', away: 'Brazil' },
  { id: '00000000-0000-0000-0000-000000000018', home: 'Morocco', away: 'Haiti' },
  // Group D
  { id: '00000000-0000-0000-0000-000000000019', home: 'USA', away: 'Paraguay' },
  { id: '00000000-0000-0000-0000-000000000020', home: 'Australia', away: 'Turkiye' },
  { id: '00000000-0000-0000-0000-000000000021', home: 'USA', away: 'Australia' },
  { id: '00000000-0000-0000-0000-000000000022', home: 'Turkiye', away: 'Paraguay' },
  { id: '00000000-0000-0000-0000-000000000023', home: 'Turkiye', away: 'USA' },
  { id: '00000000-0000-0000-0000-000000000024', home: 'Paraguay', away: 'Australia' },
  // Group E
  { id: '00000000-0000-0000-0000-000000000025', home: 'Germany', away: 'Curacao' },
  { id: '00000000-0000-0000-0000-000000000026', home: 'Ivory Coast', away: 'Ecuador' },
  { id: '00000000-0000-0000-0000-000000000027', home: 'Germany', away: 'Ivory Coast' },
  { id: '00000000-0000-0000-0000-000000000028', home: 'Ecuador', away: 'Curacao' },
  { id: '00000000-0000-0000-0000-000000000029', home: 'Ecuador', away: 'Germany' },
  { id: '00000000-0000-0000-0000-000000000030', home: 'Curacao', away: 'Ivory Coast' },
  // Group F
  { id: '00000000-0000-0000-0000-000000000031', home: 'Netherlands', away: 'Japan' },
  { id: '00000000-0000-0000-0000-000000000032', home: 'Sweden', away: 'Tunisia' },
  { id: '00000000-0000-0000-0000-000000000033', home: 'Netherlands', away: 'Sweden' },
  { id: '00000000-0000-0000-0000-000000000034', home: 'Tunisia', away: 'Japan' },
  { id: '00000000-0000-0000-0000-000000000035', home: 'Japan', away: 'Sweden' },
  { id: '00000000-0000-0000-0000-000000000036', home: 'Tunisia', away: 'Netherlands' },
  // Group G
  { id: '00000000-0000-0000-0000-000000000037', home: 'Iran', away: 'New Zealand' },
  { id: '00000000-0000-0000-0000-000000000038', home: 'Belgium', away: 'Egypt' },
  { id: '00000000-0000-0000-0000-000000000039', home: 'Belgium', away: 'Iran' },
  { id: '00000000-0000-0000-0000-000000000040', home: 'New Zealand', away: 'Egypt' },
  { id: '00000000-0000-0000-0000-000000000041', home: 'Egypt', away: 'Iran' },
  { id: '00000000-0000-0000-0000-000000000042', home: 'New Zealand', away: 'Belgium' },
  // Group H
  { id: '00000000-0000-0000-0000-000000000043', home: 'Spain', away: 'Cape Verde' },
  { id: '00000000-0000-0000-0000-000000000044', home: 'Saudi Arabia', away: 'Uruguay' },
  { id: '00000000-0000-0000-0000-000000000045', home: 'Spain', away: 'Saudi Arabia' },
  { id: '00000000-0000-0000-0000-000000000046', home: 'Uruguay', away: 'Cape Verde' },
  { id: '00000000-0000-0000-0000-000000000047', home: 'Cape Verde', away: 'Saudi Arabia' },
  { id: '00000000-0000-0000-0000-000000000048', home: 'Uruguay', away: 'Spain' },
  // Group I
  { id: '00000000-0000-0000-0000-000000000049', home: 'France', away: 'Senegal' },
  { id: '00000000-0000-0000-0000-000000000050', home: 'Iraq', away: 'Norway' },
  { id: '00000000-0000-0000-0000-000000000051', home: 'France', away: 'Iraq' },
  { id: '00000000-0000-0000-0000-000000000052', home: 'Norway', away: 'Senegal' },
  { id: '00000000-0000-0000-0000-000000000053', home: 'Norway', away: 'France' },
  { id: '00000000-0000-0000-0000-000000000054', home: 'Senegal', away: 'Iraq' },
  // Group J
  { id: '00000000-0000-0000-0000-000000000055', home: 'Argentina', away: 'Algeria' },
  { id: '00000000-0000-0000-0000-000000000056', home: 'Austria', away: 'Jordan' },
  { id: '00000000-0000-0000-0000-000000000057', home: 'Argentina', away: 'Austria' },
  { id: '00000000-0000-0000-0000-000000000058', home: 'Jordan', away: 'Algeria' },
  { id: '00000000-0000-0000-0000-000000000059', home: 'Algeria', away: 'Austria' },
  { id: '00000000-0000-0000-0000-000000000060', home: 'Jordan', away: 'Argentina' },
  // Group K
  { id: '00000000-0000-0000-0000-000000000061', home: 'Portugal', away: 'DR Congo' },
  { id: '00000000-0000-0000-0000-000000000062', home: 'Uzbekistan', away: 'Colombia' },
  { id: '00000000-0000-0000-0000-000000000063', home: 'Portugal', away: 'Uzbekistan' },
  { id: '00000000-0000-0000-0000-000000000064', home: 'Colombia', away: 'DR Congo' },
  { id: '00000000-0000-0000-0000-000000000065', home: 'Colombia', away: 'Portugal' },
  { id: '00000000-0000-0000-0000-000000000066', home: 'DR Congo', away: 'Uzbekistan' },
  // Group L
  { id: '00000000-0000-0000-0000-000000000067', home: 'England', away: 'Croatia' },
  { id: '00000000-0000-0000-0000-000000000068', home: 'Ghana', away: 'Panama' },
  { id: '00000000-0000-0000-0000-000000000069', home: 'England', away: 'Ghana' },
  { id: '00000000-0000-0000-0000-000000000070', home: 'Panama', away: 'Croatia' },
  { id: '00000000-0000-0000-0000-000000000071', home: 'Panama', away: 'England' },
  { id: '00000000-0000-0000-0000-000000000072', home: 'Croatia', away: 'Ghana' },
]

// Generate SQL
const inserts = []
for (const user of USERS) {
  for (const match of MATCHES) {
    const [home, away] = predictScore(match.home, match.away, user.noise, user.upset)
    inserts.push(`('${user.id}', '${match.id}', ${home}, ${away})`)
  }
}

const sql = `insert into predictions (user_id, match_id, predicted_home, predicted_away)
values
${inserts.join(',\n')}
on conflict (user_id, match_id) do nothing;`

console.log(sql)
