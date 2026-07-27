import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, MotionConfig } from 'framer-motion'
import { BottomNav } from '@/components/BottomNav'
import { ToastHost } from '@/components/Feedback'
import { PageSkeleton } from '@/components/Page'
import { useSettings } from '@/hooks/useSettings'
import { useTheme } from '@/hooks/useTheme'
import { HomePage } from '@/features/home/HomePage'
import { MobilityPage } from '@/features/mobility/MobilityPage'
import { MobilityRoutinePage } from '@/features/mobility/MobilityRoutinePage'
import { ActiveWorkoutPage } from '@/features/workout/ActiveWorkoutPage'
import { WorkoutPage } from '@/features/workout/WorkoutPage'

// Progress pulls in Chart.js, which nothing else needs. Keeping it out of the
// first load is the difference between a fast and a merely acceptable start.
const ProgressPage = lazy(() =>
  import('@/features/progress/ProgressPage').then((m) => ({ default: m.ProgressPage })),
)
const SettingsPage = lazy(() =>
  import('@/features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })),
)

/** The runner takes over the whole screen — no tab bar competing with it. */
const FULL_SCREEN_ROUTES = ['/workout/active']

export function App() {
  const location = useLocation()
  const settings = useSettings()
  useTheme(settings?.theme)

  const immersive = FULL_SCREEN_ROUTES.includes(location.pathname)

  return (
    /* `reducedMotion="user"` makes every motion component respect the OS
       setting, so honouring it is one decision rather than one per animation.
       The CSS half is already handled in index.css. */
    <MotionConfig reducedMotion="user">
      <div className="min-h-dvh bg-canvas">
        <Suspense fallback={<PageSkeleton />}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<HomePage />} />
              <Route path="/workout" element={<WorkoutPage />} />
              <Route path="/workout/active" element={<ActiveWorkoutPage />} />
              <Route path="/mobility" element={<MobilityPage />} />
              <Route path="/mobility/:id" element={<MobilityRoutinePage />} />
              <Route path="/progress" element={<ProgressPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </Suspense>

        {immersive ? null : <BottomNav />}
        <ToastHost />
      </div>
    </MotionConfig>
  )
}
