'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { DiretoriaSummary } from '@/api/types'
import { useChartTheme } from '@/hooks/useChartTheme'

interface Props {
  byDiretoria: DiretoriaSummary[]
}

export function LeadsByTeamPanel({ byDiretoria }: Props) {
  const chart = useChartTheme()
  const chartData = byDiretoria
    .filter((d) => d.leads > 0)
    .sort((a, b) => b.leads - a.leads || a.name.localeCompare(b.name, 'pt-BR'))

  if (chartData.length === 0) {
    return (
      <p className="text-sm text-slate-400 dark:text-slate-500 py-12 text-center">
        Nenhum lead no período para as diretorias.
      </p>
    )
  }

  const chartHeight = Math.max(260, chartData.length * 44)

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        layout="vertical"
        data={chartData}
        margin={{ top: 4, right: 20, left: 4, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chart.grid} />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: chart.tick }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={92}
          interval={0}
          tick={{ fontSize: 11, fill: chart.tickSecondary }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip contentStyle={chart.tooltip} cursor={{ fill: chart.cursor }} />
        <Bar dataKey="leads" name="Leads" fill="#1e3a8a" radius={[0, 6, 6, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  )
}
