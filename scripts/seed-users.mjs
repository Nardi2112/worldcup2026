import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ehpyimvxceexcbttodzh.supabase.co'
const SERVICE_KEY = 'sb_secret_R-YgsvOA94RwLrmZ22Y4IQ_5UL0Vpr-'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const FAKE_USERS = [
  { email: 'yuval@test.com',   password: 'Test1234!', display_name: 'Yuval' },
  { email: 'dana@test.com',    password: 'Test1234!', display_name: 'Dana' },
  { email: 'omer@test.com',    password: 'Test1234!', display_name: 'Omer' },
  { email: 'noa@test.com',     password: 'Test1234!', display_name: 'Noa' },
  { email: 'itay@test.com',    password: 'Test1234!', display_name: 'Itay' },
]

async function main() {
  // שלוף את כל המשחקים
  const { data: matches } = await supabase
    .from('matches')
    .select('id')
    .eq('stage', 'group')

  if (!matches?.length) {
    console.error('No matches found!')
    process.exit(1)
  }

  for (const u of FAKE_USERS) {
    console.log(`Creating user: ${u.display_name}...`)

    // יצירת משתמש
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
    })

    if (authError) {
      if (authError.message.includes('already been registered')) {
        console.log(`  → already exists, skipping auth creation`)
        // מצא את ה-user הקיים
        const { data: { users } } = await supabase.auth.admin.listUsers()
        const existing = users.find(x => x.email === u.email)
        if (existing) await seedPredictions(existing.id, matches)
      } else {
        console.error(`  → error: ${authError.message}`)
      }
      continue
    }

    const userId = authData.user.id

    // יצירת פרופיל
    await supabase.from('profiles').upsert({
      id: userId,
      display_name: u.display_name,
    })

    await seedPredictions(userId, matches)
    console.log(`  ✓ done`)
  }

  console.log('\nAll done!')
}

async function seedPredictions(userId, matches) {
  const predictions = matches.map(m => ({
    user_id: userId,
    match_id: m.id,
    predicted_home: Math.floor(Math.random() * 5),
    predicted_away: Math.floor(Math.random() * 5),
  }))

  const { error } = await supabase
    .from('predictions')
    .upsert(predictions, { onConflict: 'user_id,match_id' })

  if (error) console.error(`  → predictions error: ${error.message}`)
  else console.log(`  ✓ ${predictions.length} predictions seeded`)
}

main()
