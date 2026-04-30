'use client'

import { useEffect, useState } from 'react'

export default function Countdown({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 })
  const [started, setStarted] = useState(false)

  useEffect(() => {
    function update() {
      const diff = new Date(targetDate).getTime() - Date.now()
      if (diff <= 0) { setStarted(true); return }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        mins: Math.floor((diff % 3600000) / 60000),
        secs: Math.floor((diff % 60000) / 1000),
      })
    }
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [targetDate])

  if (started) return (
    <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-semibold">
      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
      Tournament is live!
    </div>
  )

  return (
    <div className="flex gap-3 justify-center">
      {[
        { v: timeLeft.days, l: 'Days' },
        { v: timeLeft.hours, l: 'Hrs' },
        { v: timeLeft.mins, l: 'Min' },
        { v: timeLeft.secs, l: 'Sec' },
      ].map(({ v, l }) => (
        <div key={l} className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-center min-w-[52px]">
          <div className="text-xl font-bold text-green-400">{String(v).padStart(2, '0')}</div>
          <div className="text-xs text-gray-500">{l}</div>
        </div>
      ))}
    </div>
  )
}
