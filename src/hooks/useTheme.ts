import { useEffect } from 'react'
import type { ThemeMode } from '@/storage/types'

const STORAGE_KEY = 'arohan.theme'

function resolve(mode: ThemeMode): boolean {
  if (mode === 'dark') return true
  if (mode === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function apply(mode: ThemeMode): void {
  const dark = resolve(mode)
  document.documentElement.classList.toggle('dark', dark)
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
}

/**
 * Keeps the `dark` class in sync with the stored preference. The same value is
 * mirrored into localStorage so `index.html` can apply it before first paint.
 */
export function useTheme(mode: ThemeMode | undefined): void {
  useEffect(() => {
    if (!mode) return

    apply(mode)
    try {
      localStorage.setItem(STORAGE_KEY, mode)
    } catch {
      // Private browsing can refuse writes; the class is already applied.
    }

    if (mode !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => apply('system')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [mode])
}
