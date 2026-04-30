export default function HowToPlayPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white px-4 py-8 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-6">📖 How to Play</h1>

      <div className="space-y-6">

        {/* Overview */}
        <Section title="🎮 Overview">
          <p className="text-gray-400 text-sm leading-relaxed">
            Predict the score of every World Cup 2026 match and earn points for accuracy.
            Compete with friends in private leagues or against everyone on the global leaderboard.
          </p>
        </Section>

        {/* Scoring */}
        <Section title="⚡ Scoring System">
          <div className="space-y-4">
            <div>
              <div className="text-sm font-semibold text-green-400 mb-2">Group Stage</div>
              <ScoreRow label="Exact score (e.g. 2–1 ✓)" pts={6} color="green" />
              <ScoreRow label="Correct direction (win/draw)" pts={3} color="blue" />
              <ScoreRow label="Wrong prediction" pts={0} color="gray" />
            </div>
            <div>
              <div className="text-sm font-semibold text-green-400 mb-2">Knockout Stage (R32 → Final)</div>
              <ScoreRow label="Exact score" pts={10} color="green" />
              <ScoreRow label="Correct direction" pts={5} color="blue" />
              <ScoreRow label="Wrong prediction" pts={0} color="gray" />
            </div>
          </div>
        </Section>

        {/* Bonus */}
        <Section title="⭐ Bonus Predictions">
          <p className="text-gray-400 text-sm mb-3">Submit once before the tournament starts:</p>
          <div className="space-y-2">
            <BonusRow label="Tournament Champion" pts={15} />
            <BonusRow label="Runner-up (Finalist)" pts={10} />
            <BonusRow label="Top Scorer (Golden Boot)" pts={15} />
            <BonusRow label="Top 2 in each group (×24)" pts={5} />
            <BonusRow label="Most goals scored (tournament)" pts={7} />
            <BonusRow label="Most goals conceded (group stage)" pts={7} />
          </div>
        </Section>

        {/* Deadlines */}
        <Section title="⏰ Deadlines">
          <p className="text-gray-400 text-sm leading-relaxed">
            Predictions for each match lock <span className="text-white font-semibold">5 minutes before kickoff</span>.
            Bonus predictions lock when the tournament begins on <span className="text-white font-semibold">June 11, 2026</span>.
          </p>
        </Section>

        {/* Leagues */}
        <Section title="👥 Private Leagues">
          <p className="text-gray-400 text-sm leading-relaxed mb-3">
            Create a private league and invite friends, family or colleagues to compete together.
          </p>
          <ol className="text-sm text-gray-400 space-y-2 list-decimal list-inside">
            <li>Go to <span className="text-white">My League</span> from the home screen</li>
            <li>Tap <span className="text-white">Create League</span> and give it a name</li>
            <li>Share the invite code or link with your group</li>
            <li>Friends join by entering the invite code</li>
            <li>Track your private leaderboard throughout the tournament</li>
          </ol>
        </Section>

        {/* Tips */}
        <Section title="💡 Tips">
          <ul className="text-sm text-gray-400 space-y-2">
            <li>• Predict all 72 group stage matches before June 11</li>
            <li>• Don&apos;t forget your bonus predictions — they&apos;re worth a lot</li>
            <li>• Knockout matches are worth more points — stay active</li>
            <li>• Check results after each matchday to track your score</li>
          </ul>
        </Section>

      </div>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
      <h2 className="font-semibold mb-3">{title}</h2>
      {children}
    </div>
  )
}

function ScoreRow({ label, pts, color }: { label: string; pts: number; color: 'green' | 'blue' | 'gray' }) {
  const colors = {
    green: 'text-green-400 bg-green-400/10',
    blue: 'text-blue-400 bg-blue-400/10',
    gray: 'text-gray-500 bg-gray-800',
  }
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-gray-400">{label}</span>
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors[color]}`}>
        {pts > 0 ? `+${pts}` : '0'} pts
      </span>
    </div>
  )
}

function BonusRow({ label, pts }: { label: string; pts: number }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-xs font-bold text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full">+{pts} pts</span>
    </div>
  )
}
