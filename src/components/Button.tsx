import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-accent-ink shadow-card active:brightness-95',
  secondary: 'bg-raised text-ink border border-line active:bg-sunken',
  ghost: 'text-muted active:bg-sunken',
  danger: 'bg-rose/10 text-rose border border-rose/25 active:bg-rose/20',
}

const SIZES: Record<Size, string> = {
  sm: 'h-10 px-4 text-sm rounded-xl gap-1.5',
  md: 'h-12 px-5 text-[15px] rounded-2xl gap-2',
  lg: 'h-14 px-6 text-base rounded-2xl gap-2.5',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  full?: boolean
  icon?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  full,
  icon,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center font-semibold no-select',
        'transition-[transform,background-color,opacity] duration-150 ease-[var(--ease-out-soft)]',
        'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40',
        VARIANTS[variant],
        SIZES[size],
        full && 'w-full',
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}

export function IconButton({
  label,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        'inline-flex h-11 w-11 items-center justify-center rounded-full text-muted',
        'transition-transform duration-150 active:scale-95 active:bg-sunken',
        'disabled:pointer-events-none disabled:opacity-40',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
