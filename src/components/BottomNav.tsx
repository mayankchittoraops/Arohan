import { NavLink } from 'react-router-dom'
import { Dumbbell, House, LineChart, Settings, Wind } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'

const TABS = [
  { to: '/', label: 'Home', Icon: House, end: true },
  { to: '/workout', label: 'Workout', Icon: Dumbbell, end: false },
  { to: '/mobility', label: 'Mobility', Icon: Wind, end: false },
  { to: '/progress', label: 'Progress', Icon: LineChart, end: false },
  { to: '/settings', label: 'Settings', Icon: Settings, end: false },
]

export function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center pb-safe"
    >
      <div className="pointer-events-auto mx-3 mb-3 flex w-full max-w-lg items-stretch gap-0.5 rounded-xl3 border border-line bg-raised/85 p-1.5 shadow-card backdrop-blur-xl">
        {TABS.map(({ to, label, Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="min-w-0 flex-1">
            {({ isActive }) => (
              <span
                className={cn(
                  'relative flex h-14 flex-col items-center justify-center gap-1 rounded-2xl no-select',
                  isActive ? 'text-accent' : 'text-faint',
                )}
              >
                {isActive ? (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-2xl bg-accent-soft"
                    transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                  />
                ) : null}
                <Icon className="relative h-[22px] w-[22px]" strokeWidth={isActive ? 2.4 : 2} />
                <span className="relative text-[10px] font-semibold tracking-tight">{label}</span>
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
