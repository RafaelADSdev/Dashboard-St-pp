'use client'

import clsx from 'clsx'
import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { TooltipContentProps } from 'recharts'
import type { RoletaLeadSummary, SourceLeadSummary } from '@/api/types'
import { isStuppRoletaTitle } from '@/api/bitrixRoletas'
import { useChartTheme } from '@/hooks/useChartTheme'
import { getRankingBarColor } from '@/lib/stageColors'
import {
  chartEmptyState,
  chartSectionTitle,
  chartTooltipBody,
  chartTooltipDivider,
  chartTooltipMuted,
  chartTooltipSurface,
  chartTooltipTitle,
  chartTooltipValue,
} from './chartUi'

const ROleta_PAGE_SIZE = 10
const LABEL_MAX_CHARS = 32

interface Props {
  bySource: SourceLeadSummary[]
  byRoleta: RoletaLeadSummary[]
}

function truncateLabel(value: string, maxChars = LABEL_MAX_CHARS): string {
  if (value.length <= maxChars) return value
  return `${value.slice(0, maxChars - 1)}…`
}

function RoletaBreakdownTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null

  const item = payload[0]?.payload as RoletaLeadSummary | undefined
  if (!item) return null

  return (
    <div className={clsx('max-w-sm', chartTooltipSurface)}>
      <p className={clsx('leading-snug', chartTooltipTitle)}>{item.roleta}</p>
      <p className={clsx('mt-1', chartTooltipMuted)}>
        Total: <span className={chartTooltipValue}>{item.count}</span>
      </p>
      {item.sources.length > 0 && (
        <div className={clsx('mt-2', chartTooltipDivider)}>
          <p className={clsx('mb-1', chartTooltipMuted)}>Origens nesta roleta</p>
          <ul className="max-h-40 space-y-1 overflow-y-auto">
            {item.sources.map((entry) => (
              <li
                key={entry.source}
                className={clsx('flex items-center justify-between gap-3', chartTooltipBody)}
              >
                <span className="truncate">{entry.source}</span>
                <span className={clsx('shrink-0', chartTooltipValue)}>{entry.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function SourceBreakdownTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null

  const item = payload[0]?.payload as SourceLeadSummary | undefined
  if (!item) return null

  const stuppRoletas = item.roletas.filter((entry) => isStuppRoletaTitle(entry.roleta))

  return (
    <div className={clsx('max-w-sm', chartTooltipSurface)}>
      <p className={chartTooltipTitle}>{label}</p>
      <p className={clsx('mt-1', chartTooltipMuted)}>
        Total: <span className={chartTooltipValue}>{item.count}</span>
      </p>
      {stuppRoletas.length > 0 && (
        <div className={clsx('mt-2', chartTooltipDivider)}>
          <p className={clsx('mb-1', chartTooltipMuted)}>Roletas Stüpp desta origem</p>
          <ul className="max-h-40 space-y-1 overflow-y-auto">
            {stuppRoletas.map((entry) => (
              <li
                key={entry.roleta}
                className={clsx('flex items-center justify-between gap-3', chartTooltipBody)}
              >
                <span className="truncate">{entry.roleta}</span>
                <span className={clsx('shrink-0', chartTooltipValue)}>{entry.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function RoletaRankingChart({ data }: { data: RoletaLeadSummary[] }) {
  const chart = useChartTheme()
  const [showAll, setShowAll] = useState(false)

  const stuppRoletas = useMemo(
    () => data.filter((item) => isStuppRoletaTitle(item.roleta)),
    [data]
  )

  const visibleData = showAll ? stuppRoletas : stuppRoletas.slice(0, ROleta_PAGE_SIZE)
  const hasMore = stuppRoletas.length > ROleta_PAGE_SIZE

  if (stuppRoletas.length === 0) {
    return (
      <p className={clsx('py-6 text-center', chartEmptyState)}>
        Nenhuma roleta Stüpp encontrada no período.
      </p>
    )
  }

  const chartHeight = Math.max(220, visibleData.length * 40)
  const maxCount = visibleData.reduce((max, item) => Math.max(max, item.count), 0)

  return (
    <div>
      <h3 className={clsx('mb-3', chartSectionTitle)}>
        Roletas Stüpp com mais leads
      </h3>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart layout="vertical" data={visibleData} margin={{ top: 0, right: 20, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chart.grid} />
          <XAxis type="number" tick={{ fontSize: 11, fill: chart.tick }} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="roleta"
            tick={({ x, y, payload }) => (
              <text
                x={x}
                y={y}
                dy={4}
                textAnchor="end"
                fill={chart.tickSecondary}
                fontSize={11}
              >
                {truncateLabel(String(payload?.value ?? ''))}
              </text>
            )}
            width={220}
            axisLine={false}
            tickLine={false}
            interval={0}
          />
          <Tooltip content={RoletaBreakdownTooltip} cursor={{ fill: chart.cursor }} />
          <Bar dataKey="count" name="Leads" radius={[0, 6, 6, 0]} maxBarSize={28}>
            {visibleData.map((item, index) => (
              <Cell key={index} fill={getRankingBarColor(item.count, maxCount)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {hasMore && (
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={() => setShowAll((current) => !current)}
            className="text-sm font-medium text-indigo-600 transition hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            {showAll
              ? 'Ver menos'
              : `Veja mais (${stuppRoletas.length - ROleta_PAGE_SIZE} restantes)`}
          </button>
        </div>
      )}
    </div>
  )
}

function SourceRankingChart({ data }: { data: SourceLeadSummary[] }) {
  const chart = useChartTheme()

  if (data.length === 0) {
    return (
      <p className={clsx('py-6 text-center', chartEmptyState)}>
        Nenhuma origem encontrada no período.
      </p>
    )
  }

  const chartHeight = Math.max(220, data.length * 34)
  const maxCount = data.reduce((max, item) => Math.max(max, item.count), 0)

  return (
    <div>
      <h3 className={clsx('mb-3', chartSectionTitle)}>
        Origens de captação
      </h3>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart layout="vertical" data={data} margin={{ top: 0, right: 20, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chart.grid} />
          <XAxis type="number" tick={{ fontSize: 11, fill: chart.tick }} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="source"
            tick={{ fontSize: 11, fill: chart.tickSecondary }}
            width={168}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={SourceBreakdownTooltip} cursor={{ fill: chart.cursor }} />
          <Bar dataKey="count" name="Leads" radius={[0, 6, 6, 0]} maxBarSize={28}>
            {data.map((item, index) => (
              <Cell key={index} fill={getRankingBarColor(item.count, maxCount)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function LeadsBySourceChart({ bySource, byRoleta }: Props) {
  const stuppRoletas = useMemo(
    () => byRoleta.filter((item) => isStuppRoletaTitle(item.roleta)),
    [byRoleta]
  )

  if (bySource.length === 0 && stuppRoletas.length === 0) {
    return (
      <p className={clsx('py-8 text-center', chartEmptyState)}>
        Nenhuma origem ou roleta Stüpp encontrada no período.
      </p>
    )
  }

  return (
    <div className="space-y-8">
      <RoletaRankingChart data={byRoleta} />
      <SourceRankingChart data={bySource} />
    </div>
  )
}
