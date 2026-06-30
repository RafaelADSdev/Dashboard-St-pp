import clsx from 'clsx'
import type { LucideIcon } from 'lucide-react'
import { BarChart3, Building2, TrendingUp } from 'lucide-react'
import { formatNumber } from '@/utils/formatters'

const variants = {
  default: {
    card: 'from-slate-50 to-white border-slate-200 dark:border-slate-600 dark:bg-slate-800',
    icon: 'bg-slate-100 text-slate-600 dark:bg-slate-700/70 dark:text-slate-300',
    value: 'text-slate-900 dark:text-slate-50',
    accent: 'bg-slate-400',
  },
  indigo: {
    card: 'from-indigo-50/80 to-white border-indigo-100 dark:border-indigo-500/30 dark:bg-[#161b2e]',
    icon: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300',
    value: 'text-indigo-700 dark:text-indigo-300',
    accent: 'bg-indigo-500',
  },
  emerald: {
    card: 'from-emerald-50/80 to-white border-emerald-100 dark:border-emerald-500/30 dark:bg-[#101f1a]',
    icon: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
    value: 'text-emerald-700 dark:text-emerald-300',
    accent: 'bg-emerald-500',
  },
  brand: {
    card: 'from-brand-50/80 to-white border-brand-100 dark:border-brand-500/30 dark:bg-[#1c1810]',
    icon: 'bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400',
    value: 'text-brand-700 dark:text-brand-400',
    accent: 'bg-brand-500',
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
        'relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 shadow-sm transition-shadow hover:shadow-md',
        'dark:bg-none dark:shadow-none dark:hover:shadow-lg dark:hover:shadow-black/20',
        v.card
      )}
    >
      <div className={clsx('absolute top-0 left-0 right-0 h-1', v.accent)} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className={clsx('text-3xl font-bold mt-2 tabular-nums tracking-tight', v.value)}>
            {displayValue}
          </p>
        </div>
        <div className={clsx('flex items-center justify-center w-10 h-10 rounded-xl', v.icon)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}
