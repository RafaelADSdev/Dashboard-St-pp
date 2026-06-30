'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useChartTheme } from '@/hooks/useChartTheme'
import { ChartTooltip } from './ChartTooltip'

interface Props {
  data: { date: string; economico: number; geral: number }[]
  esteira?: 'both' | 'geral' | 'economico'
}

export function LeadsOverTimeChart({ data, esteira = 'both' }: Props) {
  const chart = useChartTheme()
  const showEconomico = esteira === 'both' || esteira === 'economico'
  const showGeral = esteira === 'both' || esteira === 'geral'

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 5, right: 12, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="colorEco" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorGeral" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: chart.tick }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: chart.tick }} axisLine={false} tickLine={false} />
        <Tooltip content={ChartTooltip} />
        {esteira === 'both' && (
          <Legend
            wrapperStyle={{ fontSize: '12px', paddingTop: '12px', color: chart.isDark ? '#f1f5f9' : '#0f172a' }}
            iconType="circle"
          />
        )}
        {showEconomico && (
          <Area
            type="monotone"
            dataKey="economico"
            name="Econômico"
            stroke="#6366f1"
            fill="url(#colorEco)"
            strokeWidth={2.5}
          />
        )}
        {showGeral && (
          <Area
            type="monotone"
            dataKey="geral"
            name="Geral"
            stroke="#10b981"
            fill="url(#colorGeral)"
            strokeWidth={2.5}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  )
}
