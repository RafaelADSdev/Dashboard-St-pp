'use client'

import clsx from 'clsx'
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
import type { DiretoriaSummary } from '@/api/types'
import { getDiretoriaColor } from '@/lib/diretoriaColors'
import { useChartTheme } from '@/hooks/useChartTheme'
import { getRankingBarColor } from '@/lib/stageColors'
import { ChartTooltip } from './ChartTooltip'
import { chartEmptyState } from './chartUi'

interface TeamRow {
  equipe: string
  leads: number
}

interface Props {
  byDiretoria?: DiretoriaSummary[]
  byTeam?: TeamRow[]
}

export function LeadsByTeamPanel({ byDiretoria = [], byTeam }: Props) {
  const chart = useChartTheme()
  const teamMode = byTeam !== undefined

  const chartData = teamMode
    ? [...(byTeam ?? [])]
        .filter((team) => team.leads > 0)
        .sort((a, b) => b.leads - a.leads || a.equipe.localeCompare(b.equipe, 'pt-BR'))
        .map((team) => ({ name: team.equipe, leads: team.leads }))
    : byDiretoria
        .filter((diretoria) => diretoria.leads > 0)
        .sort((a, b) => b.leads - a.leads || a.name.localeCompare(b.name, 'pt-BR'))

  if (chartData.length === 0) {
    return (
      <p className={clsx(chartEmptyState, 'py-12 text-center')}>
        {teamMode
          ? 'Nenhum lead no período para as equipes selecionadas.'
          : 'Nenhum lead no período para as diretorias.'}
      </p>
    )
  }

  const chartHeight = Math.max(260, chartData.length * 44)
  const maxLeads = chartData.reduce((max, row) => Math.max(max, row.leads), 0)

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
          width={teamMode ? 180 : 92}
          interval={0}
          tick={
            teamMode
              ? { fontSize: 11, fill: chart.tickSecondary }
              : ({ x, y, payload }) => (
                  <text
                    x={x}
                    y={y}
                    dy={4}
                    textAnchor="end"
                    fill={getDiretoriaColor(String(payload?.value ?? ''))}
                    fontSize={11}
                    fontWeight={600}
                  >
                    {String(payload?.value ?? '')}
                  </text>
                )
          }
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={ChartTooltip} cursor={{ fill: chart.cursor }} />
        <Bar dataKey="leads" name="Leads" radius={[0, 6, 6, 0]} maxBarSize={32}>
          {chartData.map((row, index) => (
            <Cell
              key={index}
              fill={
                teamMode
                  ? getRankingBarColor(row.leads, maxLeads)
                  : getDiretoriaColor(row.name)
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
