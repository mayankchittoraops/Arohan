import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'

export interface Toast {
  id: number
  message: string
  tone: 'neutral' | 'success' | 'warning'
}

interface ToastContextValue {
  toasts: Toast[]
  show: (message: string, tone?: Toast['tone']) => void
  dismiss: (id: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id))
  }, [])

  const show = useCallback(
    (message: string, tone: Toast['tone'] = 'neutral') => {
      const id = nextId.current++
      setToasts((current) => [...current.slice(-2), { id, message, tone }])
      window.setTimeout(() => dismiss(id), 3600)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ toasts, show, dismiss }), [toasts, show, dismiss])

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside a ToastProvider')
  return context
}
