import clsx from 'clsx'
import type { ReactNode } from 'react'
import { chartTooltipMuted } from '@/components/charts/chartUi'

interface Props {
  title: string
  description?: string
  descriptionClassName?: string
  children: ReactNode
  className?: string
}

export function ChartCard({
  title,
  description,
  descriptionClassName,
  children,
  className = '',
}: Props) {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-indigo/8 bg-cloud p-5',
        'transition-colors duration-200 hover:border-indigo/14',
        'dark:border-cloud/10 dark:bg-cloud/5 dark:hover:border-cloud/15',
        className
      )}
    >
      <div className="mb-5">
        <h2 className="text-base font-semibold text-indigo dark:text-cream">{title}</h2>
        {description ? (
          <p className={clsx('mt-0.5 text-xs', chartTooltipMuted, descriptionClassName)}>
            {description}
          </p>
        ) : null}
      </div>

      <div>{children}</div>
    </div>
  )
}
