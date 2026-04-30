'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/',            icon: '🏠', label: 'Home' },
  { href: '/predict',     icon: '🎯', label: 'Predict' },
  { href: '/results',     icon: '📊', label: 'Results' },
  { href: '/leaderboard', icon: '🏅', label: 'Standings' },
  { href: '/league',      icon: '👥', label: 'League' },
]

export default function BottomNav() {
  const path = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-50 safe-area-pb">
      <div className="flex max-w-md mx-auto">
        {NAV.map(item => {
          const active = path === item.href
          return (
            <Link key={item.href} href={item.href}
              className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors ${active ? 'text-green-400' : 'text-gray-500'}`}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
