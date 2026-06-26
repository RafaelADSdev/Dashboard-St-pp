'use client'

import { useMemo, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { DiretoriaSummary, TeamDetail } from '@/api/types'
import { filterSelectClass } from '@/components/ui/styles'
import { formatNumber } from '@/utils/formatters'
import { LeadsOverTimeChart } from './LeadsOverTimeChart'
import { LeadsByStageChart } from './LeadsByStageChart'

const tooltipStyle = {
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
  fontSize: '13px',
}

interface Props {
  byDiretoria: DiretoriaSummary[]
  teamDetails: TeamDetail[]
}

export function LeadsByTeamPanel({ byDiretoria, teamDetails }: Props) {
  const [selectedId, setSelectedId] = useState('')

  const selectedTeam = useMemo(
    () => teamDetails.find((t) => t.id === selectedId),
    [teamDetails, selectedId]
  )

  const diretoriasInData = useMemo(() => {
    const names = new Set(teamDetails.map((t) => t.diretoria))
    return [...names].sort()
  }, [teamDetails])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between gap-y-2">
        <p className="text-sm text-slate-500">Selecione o que deseja visualizar</p>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className={`${filterSelectClass} min-w-[240px] max-w-full`}
        >
          <option value="">Todas as diretorias (resumo)</option>
          {diretoriasInData.map((diretoria) => (
            <optgroup key={diretoria} label={diretoria}>
              {teamDetails
                .filter((t) => t.diretoria === diretoria)
                .map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.label}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </div>

      {!selectedId ? (
        <DiretoriaChart data={byDiretoria} />
      ) : selectedTeam ? (
        <TeamDetailView team={selectedTeam} />
      ) : (
        <p className="text-sm text-slate-400 py-12 text-center">Equipe não encontrada.</p>
      )}
    </div>
  )
}

function DiretoriaChart({ data }: { data: DiretoriaSummary[] }) {
  const chartData = data.filter((d) => d.leads > 0)

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

function TeamDetailView({ team }: { team: TeamDetail }) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-blue-50 border border-blue-100 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-800/70">
          {team.diretoria}
        </p>
        <p className="text-lg font-semibold text-blue-950 mt-1">{team.label}</p>
        <p className="text-3xl font-bold text-blue-900 mt-2 tabular-nums">
          {formatNumber(team.leads)}{' '}
          <span className="text-base font-medium text-blue-800/80">leads no período</span>
        </p>
      </div>

      {team.leads === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">
          Nenhum lead desta equipe no período selecionado.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          <div>
            <p className="text-sm font-medium text-slate-700 mb-3">Por fase do funil</p>
            <LeadsByStageChart data={team.byStage} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 mb-3">Evolução no período</p>
            <LeadsOverTimeChart data={team.overTime} />
          </div>
        </div>
      )}
    </div>
  )
}
