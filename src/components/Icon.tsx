import {
  Award,
  CheckCheck,
  Clock,
  Droplet,
  Dumbbell,
  Flag,
  Flame,
  Footprints,
  HeartPulse,
  Moon,
  Mountain,
  MountainSnow,
  Ruler,
  StretchHorizontal,
  Timer,
  Trophy,
  Wind,
  Zap,
  type LucideIcon,
} from 'lucide-react'

/** Icons referenced by name from the habit and achievement data. */
const REGISTRY: Record<string, LucideIcon> = {
  dumbbell: Dumbbell,
  wind: Wind,
  footprints: Footprints,
  droplet: Droplet,
  moon: Moon,
  'stretch-horizontal': StretchHorizontal,
  flag: Flag,
  flame: Flame,
  trophy: Trophy,
  zap: Zap,
  timer: Timer,
  'heart-pulse': HeartPulse,
  'check-check': CheckCheck,
  clock: Clock,
  mountain: Mountain,
  'mountain-snow': MountainSnow,
  ruler: Ruler,
}

export function Icon({
  name,
  className,
  strokeWidth = 2,
}: {
  name: string
  className?: string
  strokeWidth?: number
}) {
  const Component = REGISTRY[name] ?? Award
  return <Component className={className} strokeWidth={strokeWidth} aria-hidden />
}
