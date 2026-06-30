'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { useChartTheme } from '@/hooks/useChartTheme'
import { ChartTooltip } from './ChartTooltip'

const SOURCE_COLORS = ['#22c55e', '#3b82f6', '#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']

interface Props {
  data: { source: string; count: number }[]
}

export function LeadsBySourceChart({ data }: Props) {
  const chart = useChartTheme()

  if (data.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">Nenhuma origem encontrada no período.</p>
    )
  }

  const chartHeight = Math.max(240, data.length * 36)

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart layout="vertical" data={data} margin={{ top: 0, right: 20, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chart.grid} />
        <XAxis type="number" tick={{ fontSize: 11, fill: chart.tick }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="source"
          tick={{ fontSize: 11, fill: chart.tickSecondary }}
          width={130}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={ChartTooltip} cursor={{ fill: chart.cursor }} />
        <Bar dataKey="count" name="Leads" radius={[0, 6, 6, 0]} maxBarSize={28}>
          {data.map((_, i) => (
            <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
