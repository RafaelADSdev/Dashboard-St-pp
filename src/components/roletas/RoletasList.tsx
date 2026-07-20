'use client'

import { useState } from 'react'
import clsx from 'clsx'
import { ChevronDown, ChevronRight, Users } from 'lucide-react'
import type { RoletaStat } from '@/api/types'
import type { StuppCorretorOption } from '@/lib/orgPreview'
import { ROLETA_STATUS_LABELS, ROLETA_STATUS_ORDER } from '@/lib/roletaStatus'
import { formatNumber } from '@/utils/formatters'
import {
  groupRoletasByStatus,
  type RoletasFilterState,
} from '@/utils/filterRoletas'
import { type LiderancaTeamFilter } from '@/utils/roletaOrgFilter'
import { RoletaManagePanel } from './RoletaManagePanel'
import { RoletaStatusBadge } from './RoletaStatusBadge'
import { roletaStatusBadgeStyles } from './roletaStatusButtonStyles'

interface Props {
  roletas: RoletaStat[]
  filters: RoletasFilterState
  liderancaTeam?: LiderancaTeamFilter
  corretorOptions: StuppCorretorOption[]
  statsLoading?: boolean
}

function LeadMetric({
  label,
  value,
  className,
  loading,
}: {
  label: string
  value: number
  className?: string
  loading?: boolean
}) {
  return (
    <div>
      <p className={clsx('text-[10px] font-semibold uppercase tracking-wide', className)}>
        {label}
      </p>
      <p
        className={clsx(
          'text-sm tabular-nums',
          loading ? 'text-slate-400 dark:text-slate-500' : className
        )}
      >
        {loading ? '…' : formatNumber(value)}
      </p>
    </div>
  )
}

function RoletaRow({
  roleta,
  filters,
  liderancaTeam,
  corretorOptions,
  statsLoading,
}: {
  roleta: RoletaStat
  filters: RoletasFilterState
  liderancaTeam?: LiderancaTeamFilter
  corretorOptions: StuppCorretorOption[]
  statsLoading?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const corretorCount = roleta.corretores?.length ?? 0

  return (
    <div className="border-b border-slate-100 last:border-0 dark:border-slate-700/80">
      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <RoletaStatusBadge status={roleta.status} showDot={false} />
            <h4 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
              {roleta.title}
            </h4>
          </div>

          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 transition hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-300"
          >
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
            <Users className="h-3.5 w-3.5" />
            <span>
              {corretorCount} corretor{corretorCount === 1 ? '' : 'es'} · gerenciar roleta
            </span>
          </button>
        </div>

        <div className="grid shrink-0 grid-cols-3 gap-3 text-right sm:min-w-[240px]">
          <LeadMetric
            label="Total"
            value={roleta.totalLeads}
            className="font-semibold text-slate-900 dark:text-slate-100"
            loading={statsLoading}
          />
          <LeadMetric
            label="Geral"
            value={roleta.geralLeads}
            className="text-emerald-700 dark:text-emerald-300"
            loading={statsLoading}
          />
          <LeadMetric
            label="Econômico"
            value={roleta.economicoLeads}
            className="text-indigo-700 dark:text-indigo-300"
            loading={statsLoading}
          />
        </div>
      </div>

      {expanded ? (
        <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-4 dark:border-slate-700 dark:bg-slate-900/40">
          <RoletaManagePanel
            roleta={roleta}
            corretorOptions={corretorOptions}
            statsLoading={statsLoading}
          />
        </div>
      ) : null}
    </div>
  )
}

export function RoletasList({
  roletas,
  filters,
  liderancaTeam,
  corretorOptions,
  statsLoading,
}: Props) {
  const groups = groupRoletasByStatus(roletas)
  const visibleStatuses =
    filters.status === 'todas' ? ROLETA_STATUS_ORDER : [filters.status]

  const hasAnyResult = visibleStatuses.some((status) => groups[status].length > 0)
  const hasOrgFilter = Boolean(
    filters.diretoriaId || filters.liderancaId || filters.roletaId || filters.corretorId
  )

  if (!hasAnyResult) {
    return (
      <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
        {hasOrgFilter
          ? 'Nenhuma roleta encontrada para os filtros selecionados.'
          : 'Nenhuma roleta cadastrada no momento.'}
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {visibleStatuses.map((status) => {
        const items = groups[status]
        if (items.length === 0) return null

        return (
          <section
            key={status}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <header className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/50">
              <div className="flex items-center gap-2">
                <RoletaStatusBadge status={status} />
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {ROLETA_STATUS_LABELS[status]}
                </h3>
              </div>
              <span
                className={clsx(
                  'rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
                  roletaStatusBadgeStyles[status].count
                )}
              >
                {items.length}
              </span>
            </header>

            <div>
              {items.map((roleta) => (
                <RoletaRow
                  key={roleta.id}
                  roleta={roleta}
                  filters={filters}
                  liderancaTeam={liderancaTeam}
                  corretorOptions={corretorOptions}
                  statsLoading={statsLoading}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
