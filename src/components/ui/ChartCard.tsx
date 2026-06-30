import type { ReactNode } from 'react'

interface Props {
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function ChartCard({ title, description, children, className = '' }: Props) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-shadow dark:border-slate-700/80 dark:bg-slate-800/80 dark:hover:shadow-lg dark:hover:shadow-black/20 ${className}`}
    >
      <div className="mb-5">
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
        {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  )
}
