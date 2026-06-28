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

interface Props {
  data: { date: string; economico: number; geral: number }[]
  esteira?: 'both' | 'geral' | 'economico'
}

const tooltipStyle = {
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
  fontSize: '13px',
}

export function LeadsOverTimeChart({ data, esteira = 'both' }: Props) {
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
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        {esteira === 'both' && (
          <Legend
            wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
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
