import { useCallback, useRef } from 'react'

type Cue = 'tick' | 'complete' | 'start'

/**
 * Short tones and taps for timer events. Audio is synthesised with the Web Audio
 * API so nothing needs downloading, and both channels degrade to silence where
 * the platform does not support them (Safari ignores `vibrate` entirely).
 */
export function useFeedback(enabled: { sound: boolean; haptics: boolean }) {
  const contextRef = useRef<AudioContext | null>(null)

  const tone = useCallback(
    (frequency: number, durationMs: number, gain = 0.08) => {
      if (!enabled.sound) return
      try {
        contextRef.current ??= new AudioContext()
        const ctx = contextRef.current
        // iOS suspends the context until a gesture resumes it.
        void ctx.resume()

        const oscillator = ctx.createOscillator()
        const amp = ctx.createGain()
        oscillator.type = 'sine'
        oscillator.frequency.value = frequency
        amp.gain.setValueAtTime(0, ctx.currentTime)
        amp.gain.linearRampToValueAtTime(gain, ctx.currentTime + 0.01)
        amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000)
        oscillator.connect(amp).connect(ctx.destination)
        oscillator.start()
        oscillator.stop(ctx.currentTime + durationMs / 1000)
      } catch {
        // An unavailable audio context is not worth interrupting a set for.
      }
    },
    [enabled.sound],
  )

  const buzz = useCallback(
    (pattern: number | number[]) => {
      if (!enabled.haptics) return
      try {
        navigator.vibrate?.(pattern)
      } catch {
        // Not supported on iOS; nothing to do.
      }
    },
    [enabled.haptics],
  )

  return useCallback(
    (cue: Cue) => {
      if (cue === 'tick') {
        tone(660, 90, 0.05)
        buzz(15)
      } else if (cue === 'complete') {
        tone(880, 220)
        setTimeout(() => tone(1320, 260), 140)
        buzz([30, 60, 40])
      } else {
        tone(520, 140)
        buzz(20)
      }
    },
    [tone, buzz],
  )
}
