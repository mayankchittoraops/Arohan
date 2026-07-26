import { useEffect } from 'react'
import { parseClock } from '@/lib/date'
import type { Settings } from '@/storage/types'

const COPY: Record<keyof Settings['reminders'], { title: string; body: string }> = {
  workout: { title: 'Ready when you are', body: "Today's session is waiting whenever suits." },
  mobility: { title: 'A few minutes of movement', body: 'Six minutes of mobility goes a long way.' },
  review: { title: 'How did today go?', body: 'A quick check-in keeps the picture honest.' },
}

export type NotificationSupport = 'unsupported' | 'default' | 'granted' | 'denied'

export function notificationSupport(): NotificationSupport {
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.permission as NotificationSupport
}

export async function requestNotificationPermission(): Promise<NotificationSupport> {
  if (typeof Notification === 'undefined') return 'unsupported'
  return (await Notification.requestPermission()) as NotificationSupport
}

/**
 * Local, in-app reminders. Timers are scheduled for the remaining times today
 * and rescheduled whenever the app returns to the foreground, so they fire
 * while Arohan is open. There is no push server and nothing is sent anywhere.
 */
export function useReminders(settings: Settings | undefined): void {
  useEffect(() => {
    if (!settings?.remindersEnabled) return
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return

    let timers: number[] = []

    const schedule = () => {
      timers.forEach(window.clearTimeout)
      timers = []

      const now = new Date()
      const minutesNow = now.getHours() * 60 + now.getMinutes()

      for (const key of Object.keys(COPY) as Array<keyof Settings['reminders']>) {
        const at = parseClock(settings.reminders[key])
        if (at == null || at <= minutesNow) continue

        const delay = (at - minutesNow) * 60_000 - now.getSeconds() * 1000
        const id = window.setTimeout(() => {
          try {
            const { title, body } = COPY[key]
            const notification = new Notification(title, {
              body,
              tag: `arohan-${key}`,
              icon: './icons/icon-192.png',
            })
            notification.addEventListener('click', () => window.focus(), { once: true })
          } catch {
            // Some browsers only allow notifications from a service worker.
          }
        }, delay)
        timers.push(id)
      }
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') schedule()
    }

    schedule()
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      timers.forEach(window.clearTimeout)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [settings?.remindersEnabled, settings?.reminders])
}
