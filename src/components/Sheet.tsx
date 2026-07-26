import { useEffect, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { IconButton } from './Button'

/**
 * A bottom sheet on narrow screens, a centred panel on wide ones. Closes on
 * Escape and on a tap outside, and locks the page behind it.
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}) {
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

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          {/* Tap-outside target. Not a button: the labelled close control in
              the header, and Escape, are the accessible ways out. */}
          <motion.div
            aria-hidden
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="relative flex max-h-[92vh] w-full flex-col rounded-t-xl3 border border-line bg-surface shadow-card sm:max-w-lg sm:rounded-xl3"
            initial={{ y: '100%', opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0.4 }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
          >
            <div className="flex items-start gap-3 px-6 pt-6">
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
                {description ? (
                  <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>
                ) : null}
              </div>
              <IconButton label="Close" onClick={onClose} className="-mr-2 -mt-1">
                <X className="h-5 w-5" />
              </IconButton>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>

            {footer ? (
              <div className="border-t border-line px-6 py-4 pb-safe">{footer}</div>
            ) : (
              <div className="pb-safe" />
            )}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
