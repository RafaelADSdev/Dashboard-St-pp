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
import type { RoletaLeadSummary } from '@/api/types'
import { isStuppRoletaTitle } from '@/api/bitrixRoletas'
import { useChartTheme } from '@/hooks/useChartTheme'
import { getRankingBarColor } from '@/lib/stageColors'
import { formatNumber } from '@/utils/formatters'
import { normalizeRoletaLeadSummaries } from '@/utils/roletaLeadSummary'
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
  byRoleta: RoletaLeadSummary[]
}

function truncateLabel(value: string, maxChars = LABEL_MAX_CHARS): string {
  if (value.length <= maxChars) return value
  return `${value.slice(0, maxChars - 1)}…`
}

function createRoletaBreakdownTooltip(dataByRoleta: Map<string, RoletaLeadSummary>) {
  return function RoletaBreakdownTooltip({ active, payload, label }: TooltipContentProps) {
    if (!active || !payload?.length) return null

    const roletaKey = String(label ?? payload[0]?.payload?.roleta ?? '').trim()
    const item =
      dataByRoleta.get(roletaKey) ??
      (payload[0]?.payload as RoletaLeadSummary | undefined)

    if (!item) return null

    return (
      <div className={clsx('max-w-sm', chartTooltipSurface)}>
        <p className={clsx('leading-snug', chartTooltipTitle)}>{item.roleta}</p>
        <p className={clsx('mt-1', chartTooltipMuted)}>
          Total: <span className={chartTooltipValue}>{formatNumber(item.count)}</span>
        </p>
        <div className={clsx('mt-2', chartTooltipDivider)}>
          <ul className="space-y-1">
            <li className={clsx('flex items-center justify-between gap-3', chartTooltipBody)}>
              <span>Leads ativos</span>
              <span className="shrink-0 font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
                {formatNumber(item.ativos)}
              </span>
            </li>
            <li className={clsx('flex items-center justify-between gap-3', chartTooltipBody)}>
              <span>Leads perdidos</span>
              <span className="shrink-0 font-semibold tabular-nums text-red-700 dark:text-red-300">
                {formatNumber(item.perdidos)}
              </span>
            </li>
          </ul>
        </div>
      </div>
    )
  }
}

function RoletaRankingChart({ data }: { data: RoletaLeadSummary[] }) {
  const chart = useChartTheme()
  const [showAll, setShowAll] = useState(false)

  const normalizedData = useMemo(() => normalizeRoletaLeadSummaries(data), [data])

  const stuppRoletas = useMemo(
    () => normalizedData.filter((item) => isStuppRoletaTitle(item.roleta)),
    [normalizedData]
  )

  const visibleData = showAll ? stuppRoletas : stuppRoletas.slice(0, ROleta_PAGE_SIZE)
  const hasMore = stuppRoletas.length > ROleta_PAGE_SIZE

  const dataByRoleta = useMemo(
    () => new Map(normalizedData.map((item) => [item.roleta, item])),
    [normalizedData]
  )

  const tooltipContent = useMemo(
    () => createRoletaBreakdownTooltip(dataByRoleta),
    [dataByRoleta]
  )

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
          <Tooltip content={tooltipContent} cursor={{ fill: chart.cursor }} />
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

export function LeadsBySourceChart({ byRoleta }: Props) {
  const stuppRoletas = useMemo(
    () => byRoleta.filter((item) => isStuppRoletaTitle(item.roleta)),
    [byRoleta]
  )

  if (stuppRoletas.length === 0) {
    return (
      <p className={clsx('py-8 text-center', chartEmptyState)}>
        Nenhuma roleta Stüpp encontrada no período.
      </p>
    )
  }

  return <RoletaRankingChart data={byRoleta} />
}
