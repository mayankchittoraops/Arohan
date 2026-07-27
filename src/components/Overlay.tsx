import { useEffect, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { IconButton } from './Button'
import { cn } from '@/lib/cn'
import { SPRING, TRANSITION } from '@/lib/motion'

interface OverlayProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}

/**
 * Shared implementation behind `BottomSheet` and `Modal`. Both close on Escape
 * and on a tap outside, lock the page behind them, and trap nothing else — the
 * content is short enough that a full focus trap would be more machinery than
 * the screens need.
 */
function Overlay({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  variant,
}: OverlayProps & { variant: 'sheet' | 'modal' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  const sheet = variant === 'sheet'

  return (
    <AnimatePresence>
      {open ? (
        <div
          className={cn(
            'fixed inset-0 z-50 flex justify-center',
            sheet ? 'items-end sm:items-center' : 'items-center p-4',
          )}
        >
          {/* Tap-outside target. Not a button: the labelled close control in
              the header, and Escape, are the accessible ways out. */}
          <motion.div
            aria-hidden
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={TRANSITION.fast}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={cn(
              'relative flex max-h-[92vh] w-full flex-col border border-line bg-surface shadow-lifted',
              sheet ? 'rounded-t-xl3 sm:max-w-lg sm:rounded-xl3' : 'max-w-sm rounded-xl3',
            )}
            initial={sheet ? { y: '100%', opacity: 0.6 } : { scale: 0.94, opacity: 0 }}
            animate={sheet ? { y: 0, opacity: 1 } : { scale: 1, opacity: 1 }}
            exit={sheet ? { y: '100%', opacity: 0.4 } : { scale: 0.96, opacity: 0 }}
            transition={SPRING.panel}
          >
            <div className="flex items-start gap-3 px-6 pt-6">
              <div className="min-w-0 flex-1">
                <h2 className="text-heading text-ink">{title}</h2>
                {description ? (
                  <p className="mt-1 text-label leading-relaxed text-muted">{description}</p>
                ) : null}
              </div>
              <IconButton label="Close" onClick={onClose} className="-mr-2 -mt-1">
                <X className="h-5 w-5" />
              </IconButton>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>

            {footer ? (
              <div className={cn('border-t border-line px-6 py-4', sheet && 'pb-safe')}>
                {footer}
              </div>
            ) : (
              sheet && <div className="pb-safe" />
            )}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  )
}

/** Rises from the bottom on phones, centres on larger screens. For input. */
export function BottomSheet(props: OverlayProps) {
  return <Overlay {...props} variant="sheet" />
}

/** Always centred and narrow. For a single decision. */
export function Modal(props: OverlayProps) {
  return <Overlay {...props} variant="modal" />
}
