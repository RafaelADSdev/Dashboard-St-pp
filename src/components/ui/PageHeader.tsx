import type { ReactNode } from 'react'

interface Props {
  title: string
  subtitle?: string
  badge?: string
  actions?: ReactNode
}

export function PageHeader({ title, subtitle, badge, actions }: Props) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        {badge && (
          <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-600 ring-1 ring-brand-100 mb-2">
            {badge}
          </span>
        )}
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500 max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
