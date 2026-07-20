'use client'

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

const BAR_COLORS = ['#6366f1', '#10b981', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ec4899', '#22c55e', '#3b82f6']
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
    <div className="max-w-sm rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <p className="text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100">{item.roleta}</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Total: <span className="font-semibold text-slate-800 dark:text-slate-100">{item.count}</span>
      </p>
      {item.sources.length > 0 && (
        <div className="mt-2 border-t border-slate-100 pt-2 dark:border-slate-800">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Origens nesta roleta
          </p>
          <ul className="max-h-40 space-y-1 overflow-y-auto">
            {item.sources.map((entry) => (
              <li
                key={entry.source}
                className="flex items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300"
              >
                <span className="truncate">{entry.source}</span>
                <span className="shrink-0 font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                  {entry.count}
                </span>
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
    <div className="max-w-sm rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Total: <span className="font-semibold text-slate-800 dark:text-slate-100">{item.count}</span>
      </p>
      {stuppRoletas.length > 0 && (
        <div className="mt-2 border-t border-slate-100 pt-2 dark:border-slate-800">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Roletas Stüpp desta origem
          </p>
          <ul className="max-h-40 space-y-1 overflow-y-auto">
            {stuppRoletas.map((entry) => (
              <li
                key={entry.roleta}
                className="flex items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300"
              >
                <span className="truncate">{entry.roleta}</span>
                <span className="shrink-0 font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                  {entry.count}
                </span>
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
      <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Nenhuma roleta Stüpp encontrada no período.
      </p>
    )
  }

  const chartHeight = Math.max(220, visibleData.length * 40)

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
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
            {visibleData.map((_, index) => (
              <Cell key={index} fill={BAR_COLORS[index % BAR_COLORS.length]} />
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
      <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Nenhuma origem encontrada no período.
      </p>
    )
  }

  const chartHeight = Math.max(220, data.length * 34)

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
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
            {data.map((_, index) => (
              <Cell key={index} fill={BAR_COLORS[index % BAR_COLORS.length]} />
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
      <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
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
