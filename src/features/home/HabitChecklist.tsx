import { useLiveQuery } from 'dexie-react-hooks'
import { Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { Icon } from '@/components/Icon'
import { HABITS } from '@/data/habits'
import { cn } from '@/lib/cn'
import { doneHabitIds, habitsForDate, toggleHabit } from '@/storage/repo'
import type { DateKey } from '@/lib/date'

const ACCENTS: Record<string, string> = {
  accent: 'text-accent bg-accent-soft',
  teal: 'text-teal bg-teal/12',
  mint: 'text-mint bg-mint/12',
  sky: 'text-sky bg-sky/12',
  violet: 'text-violet bg-violet/12',
  amber: 'text-amber bg-amber/12',
}

export function HabitChecklist({ date }: { date: DateKey }) {
  const logs = useLiveQuery(() => habitsForDate(date), [date])
  const done = doneHabitIds(logs ?? [])

  return (
    <ul className="overflow-hidden rounded-xl2 border border-line bg-surface">
      {HABITS.map((habit) => {
        const checked = done.has(habit.id)
        return (
          <li key={habit.id} className="border-b border-line last:border-0">
            <button
              type="button"
              role="checkbox"
              aria-checked={checked}
              onClick={() => void toggleHabit(date, habit.id)}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-sunken"
            >
              <span
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                  ACCENTS[habit.accent] ?? ACCENTS.accent,
                )}
              >
                <Icon name={habit.icon} className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    'block font-medium transition-colors',
                    checked ? 'text-faint line-through' : 'text-ink',
                  )}
                >
                  {habit.name}
                </span>
                <span className="block text-xs text-faint">{habit.detail}</span>
              </span>
              <motion.span
                initial={false}
                animate={{ scale: checked ? 1 : 0.9 }}
                transition={{ type: 'spring', damping: 18, stiffness: 400 }}
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                  checked ? 'border-mint bg-mint text-white' : 'border-line-strong text-transparent',
                )}
              >
                <Check className="h-4 w-4" strokeWidth={3.5} />
              </motion.span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
