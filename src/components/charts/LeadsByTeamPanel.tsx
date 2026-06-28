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

const tooltipStyle = {
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
  fontSize: '13px',
}

interface Props {
  byDiretoria: DiretoriaSummary[]
}

export function LeadsByTeamPanel({ byDiretoria }: Props) {
  const chartData = byDiretoria.filter((d) => d.leads > 0)

  if (chartData.length === 0) {
    return (
      <p className="text-sm text-slate-400 py-12 text-center">
        Nenhum lead no período para as diretorias.
      </p>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 5, right: 12, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#334155' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f8fafc' }} />
        <Bar dataKey="leads" name="Leads" fill="#1e3a8a" radius={[6, 6, 0, 0]} maxBarSize={56} />
      </BarChart>
    </ResponsiveContainer>
  )
}
