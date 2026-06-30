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

const STAGE_COLORS = ['#f59e0b', '#6366f1', '#3b82f6', '#0ea5e9', '#10b981', '#22c55e', '#ef4444']

interface Props {
  data: { stage: string; count: number }[]
}

export function LeadsByStageChart({ data }: Props) {
  const chart = useChartTheme()

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart layout="vertical" data={data} margin={{ top: 0, right: 20, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chart.grid} />
        <XAxis type="number" tick={{ fontSize: 11, fill: chart.tick }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="stage"
          tick={{ fontSize: 11, fill: chart.tickSecondary }}
          width={110}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: chart.cursor }} />
        <Bar dataKey="count" name="Leads" radius={[0, 6, 6, 0]} maxBarSize={28}>
          {data.map((_, i) => (
            <Cell key={i} fill={STAGE_COLORS[i % STAGE_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
