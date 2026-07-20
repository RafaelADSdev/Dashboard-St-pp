'use client'

import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { Loader2, Plus, Search, UserMinus, UserRound } from 'lucide-react'
import type { RoletaCorretorMember, RoletaStat } from '@/api/types'
import type { StuppCorretorOption } from '@/lib/orgPreview'
import {
  ROLETA_STATUS_LABELS,
  ROLETA_STATUS_ORDER,
  type RoletaOperationalStatus,
} from '@/lib/roletaStatus'
import { useRoletaMutations } from '@/hooks/useRoletaMutations'
import { useUserPermissions } from '@/hooks/useUserPermissions'
import {
  corretorMatchesLiderancaTeam,
  type LiderancaTeamFilter,
} from '@/utils/roletaOrgFilter'
import type { RoletasFilterState } from '@/utils/filterRoletas'
import { groupCorretoresByLideranca } from '@/utils/groupCorretoresByLideranca'
import { formatNumber } from '@/utils/formatters'
import { RoletaStatusBadge } from './RoletaStatusBadge'
import { filterInputClass } from '@/components/ui/styles'

interface Props {
  roleta: RoletaStat
  corretorOptions: StuppCorretorOption[]
  filters: RoletasFilterState
  liderancaTeam?: LiderancaTeamFilter
  statsLoading?: boolean
}

function isCorretorHighlighted(
  corretor: RoletaCorretorMember,
  filters: RoletasFilterState,
  liderancaTeam?: LiderancaTeamFilter
) {
  if (filters.diretoriaId && corretor.diretoriaId !== filters.diretoriaId) return false
  if (filters.liderancaId) {
    const team =
      liderancaTeam ??
      ({ id: filters.liderancaId, userIds: [] } satisfies LiderancaTeamFilter)
    if (!corretorMatchesLiderancaTeam(corretor, team)) return false
  }
  if (filters.corretorId && corretor.corretorUserId !== filters.corretorId) return false
  return Boolean(filters.diretoriaId || filters.liderancaId || filters.corretorId)
}

export function RoletaManagePanel({
  roleta,
  corretorOptions,
  filters,
  liderancaTeam,
  statsLoading,
}: Props) {
  const { updateStatus, addCorretor, removeCorretor } = useRoletaMutations()
  const { canManageRoletaStatus, canManageRoletaCorretores } = useUserPermissions()
  const [addQuery, setAddQuery] = useState('')
  const [selectedCorretorId, setSelectedCorretorId] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)

  const corretores = roleta.corretores ?? []
  const corretoresByLideranca = useMemo(
    () => groupCorretoresByLideranca(corretores),
    [corretores]
  )
  const registeredIds = new Set(
    corretores.map((item) => item.corretorUserId).filter(Boolean) as string[]
  )

  const availableCorretores = useMemo(() => {
    return corretorOptions
      .filter((item) => !registeredIds.has(item.id))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  }, [corretorOptions, registeredIds])

  const filteredAddOptions = useMemo(() => {
    const normalized = addQuery.trim().toLowerCase()
    if (!normalized) return availableCorretores

    return availableCorretores.filter((item) =>
      [item.name, item.equipe, item.diretoria].some((part) =>
        part.toLowerCase().includes(normalized)
      )
    )
  }, [availableCorretores, addQuery])

  const isUpdatingStatus = updateStatus.isPending && updateStatus.variables?.roletaId === roleta.id
  const isAdding =
    addCorretor.isPending && addCorretor.variables?.roletaId === roleta.id
  const removingRecordId =
    removeCorretor.isPending ? removeCorretor.variables?.recordId : undefined

  async function handleStatusChange(status: RoletaOperationalStatus) {
    if (status === roleta.status || isUpdatingStatus) return
    setFeedback(null)
    try {
      await updateStatus.mutateAsync({ roletaId: roleta.id, status })
      setFeedback(`Status alterado para ${ROLETA_STATUS_LABELS[status].toLowerCase()}.`)
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Erro ao alterar status')
    }
  }

  async function handleAddCorretor() {
    const corretor = availableCorretores.find((item) => item.id === selectedCorretorId)
    if (!corretor || isAdding) return

    setFeedback(null)
    try {
      await addCorretor.mutateAsync({
        roletaId: roleta.id,
        roletaTitle: roleta.title,
        corretorUserId: corretor.id,
        corretorName: corretor.name,
      })
      setSelectedCorretorId('')
      setAddQuery('')
      setFeedback(`${corretor.name} adicionado à roleta.`)
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Erro ao adicionar corretor')
    }
  }

  async function handleRemoveCorretor(recordId: string, nome: string) {
    if (removingRecordId) return
    setFeedback(null)
    try {
      await removeCorretor.mutateAsync({ roletaId: roleta.id, recordId })
      setFeedback(`${nome} removido da roleta.`)
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Erro ao remover corretor')
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Status da roleta
        </p>
        {canManageRoletaStatus ? (
        <div className="flex flex-wrap gap-2">
          {ROLETA_STATUS_ORDER.map((status) => (
            <button
              key={status}
              type="button"
              disabled={isUpdatingStatus}
              onClick={() => handleStatusChange(status)}
              className={clsx(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition',
                roleta.status === status
                  ? 'ring-2 ring-brand-400 ring-offset-1 dark:ring-offset-slate-900'
                  : 'opacity-80 hover:opacity-100',
                isUpdatingStatus && 'cursor-wait opacity-60'
              )}
            >
              <RoletaStatusBadge status={status} showDot={false} />
              {ROLETA_STATUS_LABELS[status]}
            </button>
          ))}
          {isUpdatingStatus ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" /> : null}
        </div>
        ) : (
          <div className="flex items-center gap-2">
            <RoletaStatusBadge status={roleta.status} />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Você não tem permissão para alterar o status.
            </span>
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Corretores cadastrados
        </p>

        {corretores.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Nenhum corretor nesta roleta.
          </p>
        ) : (
          <div className="space-y-3">
            {corretoresByLideranca.map(([lideranca, members]) => (
              <div key={lideranca}>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  {lideranca}
                </p>
                <div className="flex flex-wrap gap-2">
                  {[...members]
                    .sort(
                      (a, b) =>
                        (b.totalLeads ?? 0) - (a.totalLeads ?? 0) ||
                        a.nome.localeCompare(b.nome, 'pt-BR')
                    )
                    .map((corretor) => (
                    <span
                      key={corretor.recordId}
                      className={clsx(
                        'inline-flex items-center gap-1 rounded-full py-1 pl-2.5 pr-1 text-xs',
                        isCorretorHighlighted(corretor, filters, liderancaTeam)
                          ? 'bg-brand-50 font-medium text-brand-800 ring-1 ring-brand-200 dark:bg-brand-500/10 dark:text-brand-200 dark:ring-brand-500/30'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-700/70 dark:text-slate-200'
                      )}
                    >
                      <UserRound className="h-3 w-3 shrink-0 opacity-70" />
                      <span>
                        {corretor.nome}
                        {corretor.cargoLabel ? (
                          <span className="ml-1 opacity-70">· {corretor.cargoLabel}</span>
                        ) : null}
                      </span>
                      <span
                        className="ml-1 rounded-full bg-white/70 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-slate-600 dark:bg-slate-900/50 dark:text-slate-300"
                        title={
                          statsLoading
                            ? 'Carregando leads do período...'
                            : `Geral: ${formatNumber(corretor.geralLeads ?? 0)} · Econômico: ${formatNumber(corretor.economicoLeads ?? 0)}`
                        }
                      >
                        {statsLoading ? '…' : formatNumber(corretor.totalLeads ?? 0)}
                      </span>
                      <button
                        type="button"
                        title="Remover corretor"
                        disabled={!canManageRoletaCorretores || removingRecordId === corretor.recordId}
                        onClick={() => handleRemoveCorretor(corretor.recordId, corretor.nome)}
                        className="ml-0.5 rounded-full p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                      >
                        {removingRecordId === corretor.recordId ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <UserMinus className="h-3 w-3" />
                        )}
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {canManageRoletaCorretores ? (
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Adicionar corretor
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={addQuery}
              onChange={(event) => {
                setAddQuery(event.target.value)
                setSelectedCorretorId('')
              }}
              placeholder="Buscar corretor Stüpp..."
              className={clsx(filterInputClass, 'w-full pl-9')}
            />
          </div>
          <select
            value={selectedCorretorId}
            onChange={(event) => setSelectedCorretorId(event.target.value)}
            className={clsx(filterInputClass, 'w-full min-w-0 sm:max-w-[280px]')}
          >
            <option value="">Selecione o corretor</option>
            {filteredAddOptions.map((corretor) => (
              <option key={corretor.id} value={corretor.id}>
                {corretor.name} · {corretor.equipe}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!selectedCorretorId || isAdding}
            onClick={handleAddCorretor}
            className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Adicionar
          </button>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          {filteredAddOptions.length === availableCorretores.length
            ? `${availableCorretores.length} corretores disponíveis`
            : `${filteredAddOptions.length} de ${availableCorretores.length} corretores`}
          {addQuery.trim() ? ' — refine a busca pelo nome, equipe ou diretoria' : ''}
        </p>
      </div>
      ) : (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Você não tem permissão para adicionar ou remover corretores nesta roleta.
        </p>
      )}

      {feedback ? (
        <p className="text-xs text-slate-600 dark:text-slate-300">{feedback}</p>
      ) : null}

      {(updateStatus.error || addCorretor.error || removeCorretor.error) && !feedback ? (
        <p className="text-xs text-red-600 dark:text-red-300">
          {(updateStatus.error ?? addCorretor.error ?? removeCorretor.error)?.message}
        </p>
      ) : null}
    </div>
  )
}
