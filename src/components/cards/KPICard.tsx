import clsx from 'clsx'
import type { LucideIcon } from 'lucide-react'
import { BarChart3, Building2, TrendingUp } from 'lucide-react'
import { formatNumber } from '@/utils/formatters'

const variants = {
  default: {
    icon: 'bg-indigo/6 text-indigo/70 dark:bg-cloud/10 dark:text-cream/80',
    value: 'text-indigo dark:text-cream',
  },
  indigo: {
    icon: 'bg-indigo/10 text-indigo dark:bg-indigo-400/15 dark:text-indigo-300',
    value: 'text-indigo dark:text-indigo-300',
  },
  emerald: {
    icon: 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300',
    value: 'text-emerald-700 dark:text-emerald-300',
  },
  brand: {
    icon: 'bg-indigo/10 text-indigo dark:bg-cloud/10 dark:text-cream/80',
    value: 'text-indigo dark:text-cream',
  },
} as const

const defaultIcons: Record<string, LucideIcon> = {
  default: BarChart3,
  indigo: TrendingUp,
  emerald: Building2,
  brand: BarChart3,
}

interface Props {
  label: string
  value?: number
  color?: keyof typeof variants
  icon?: LucideIcon
}

export function KPICard({ label, value, color = 'default', icon }: Props) {
  const v = variants[color]
  const Icon = icon ?? defaultIcons[color]
  const displayValue = value === undefined ? '…' : formatNumber(value)

  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-2xl border border-indigo/8 bg-cloud p-5 shadow-sm',
        'transition-all duration-200 hover:border-indigo/12 hover:shadow-md',
        'dark:border-cloud/10 dark:bg-cloud/5 dark:shadow-lg dark:shadow-black/10 dark:backdrop-blur-xl',
        'dark:hover:border-cloud/15 dark:hover:bg-cloud/8'
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/40 via-transparent to-transparent dark:from-cloud/5" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo/55 dark:text-cream/55">
            {label}
          </p>
          <p className={clsx('mt-2 text-3xl font-bold tabular-nums tracking-tight', v.value)}>
            {displayValue}
          </p>
        </div>
        <div className={clsx('flex h-10 w-10 items-center justify-center rounded-xl backdrop-blur-sm', v.icon)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}
