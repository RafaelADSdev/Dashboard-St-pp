'use client'

import { useMemo, useState } from 'react'
import { useAppliedFilters } from '@/store/filterStore'
import { DateRangeFilter } from '@/components/filters/DateRangeFilter'
import { DiretoriaFilter } from '@/components/filters/DiretoriaFilter'
import { EquipeFilter } from '@/components/filters/EquipeFilter'
import { CorretorFilter } from '@/components/filters/CorretorFilter'
import { KPICard } from '@/components/cards/KPICard'
import { DiretoriaRoletaFilter } from '@/components/roletas/DiretoriaRoletaFilter'
import { LiderancaRoletaFilter } from '@/components/roletas/LiderancaRoletaFilter'
import { CorretorRoletaSearchFilter } from '@/components/roletas/CorretorRoletaSearchFilter'
import { RoletaNomeFilter } from '@/components/roletas/RoletaNomeFilter'
import { RoletaStatusFilter as RoletaStatusFilterBar } from '@/components/roletas/RoletaStatusFilter'
import {
  ApplyRoletasCatalogFiltersButton,
  EMPTY_ROLETAS_CATALOG_FILTERS,
  type RoletasCatalogFilters,
} from '@/components/roletas/ApplyRoletasCatalogFiltersButton'
import { RoletasList } from '@/components/roletas/RoletasList'
import { useRoletasData } from '@/hooks/useRoletasData'
import { useStuppRoletasCatalog } from '@/hooks/useStuppRoletas'
import { PageShell } from '@/components/ui/PageShell'
import { PageHeader } from '@/components/ui/PageHeader'
import { FilterPanel } from '@/components/ui/FilterPanel'
import { ChartCard } from '@/components/ui/ChartCard'
import { FilterApplyingOverlay } from '@/components/ui/FilterApplyingOverlay'
import { ErrorState, LoadingState } from '@/components/ui/StatusMessage'
import { useFilterApplyFeedback } from '@/hooks/useFilterApplyFeedback'
import type { RoletaOperationalStatus } from '@/api/types'
import { CircleDot, PauseCircle, Sparkles } from 'lucide-react'
import {
  filterRoletas,
  groupRoletasByStatus,
} from '@/utils/filterRoletas'
import { formatLiderancaFilterLabel } from '@/api/bitrixRoletaCorretores'
import { useStuppStructurePreview } from '@/hooks/useStuppOrg'
import { mergeRoletasPageData } from '@/utils/mergeRoletasPageData'
import {
  teamHasRoletaPresence,
  type LiderancaTeamFilter,
} from '@/utils/roletaOrgFilter'

function RoletasFilters() {
  return (
    <FilterPanel ignoreEsteira>
      <DateRangeFilter />
      <DiretoriaFilter label="Diretor" />
      <EquipeFilter label="Líder (equipe)" />
      <CorretorFilter />
    </FilterPanel>
  )
}

export function RoletasPage() {
  const applied = useAppliedFilters()
  const {
    data: catalog,
    isLoading: catalogLoading,
    isError: catalogError,
    error: catalogErrorObj,
  } = useStuppRoletasCatalog()
  const { data: orgPreview, isLoading: orgLoading } = useStuppStructurePreview()
  const {
    data: stats,
    isFetching: statsFetching,
    isPending: statsPending,
    isError: statsError,
  } = useRoletasData(applied)

  const isApplyingFilters = useFilterApplyFeedback(statsFetching || statsPending)
  const statsLoading = (statsFetching || statsPending) && !stats && !statsError

  const [draftCatalogFilters, setDraftCatalogFilters] = useState<RoletasCatalogFilters>(
    EMPTY_ROLETAS_CATALOG_FILTERS
  )
  const [appliedCatalogFilters, setAppliedCatalogFilters] = useState<RoletasCatalogFilters>(
    EMPTY_ROLETAS_CATALOG_FILTERS
  )

  const data = useMemo(
    () => mergeRoletasPageData(catalog?.roletas, stats),
    [catalog?.roletas, stats]
  )

  const selectedLiderancaTeam = useMemo((): LiderancaTeamFilter | undefined => {
    if (!appliedCatalogFilters.liderancaId) return undefined

    for (const diretoria of orgPreview?.diretorias ?? []) {
      const team = diretoria.teams.find((item) => item.id === appliedCatalogFilters.liderancaId)
      if (team) {
        return {
          id: team.id,
          leaderId: team.leaderId,
          userIds: team.userIds ?? [],
        }
      }
    }

    return {
      id: appliedCatalogFilters.liderancaId,
      userIds: [],
    }
  }, [appliedCatalogFilters.liderancaId, orgPreview?.diretorias])

  const liderancaOptions = useMemo(() => {
    const roletas = data?.roletas ?? []
    const options: { id: string; name: string; diretoriaId?: string }[] = []

    for (const diretoria of orgPreview?.diretorias ?? []) {
      if (draftCatalogFilters.diretoriaId && diretoria.id !== draftCatalogFilters.diretoriaId) {
        continue
      }

      for (const team of diretoria.teams) {
        const teamFilter: LiderancaTeamFilter = {
          id: team.id,
          leaderId: team.leaderId,
          userIds: team.userIds ?? [],
        }

        const hasPresence = roletas.some((roleta) => teamHasRoletaPresence(roleta, teamFilter))
        if (!hasPresence) continue

        options.push({
          id: team.id,
          name: formatLiderancaFilterLabel(team),
          diretoriaId: diretoria.id,
        })
      }
    }

    return options.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  }, [data?.roletas, orgPreview?.diretorias, draftCatalogFilters.diretoriaId])

  const corretorSearchOptions = useMemo(() => {
    const stuppIds = new Set(orgPreview?.org.allUserIds ?? [])
    const idsInRoletas = new Set<string>()

    for (const roleta of data?.roletas ?? []) {
      for (const corretor of roleta.corretores ?? []) {
        if (corretor.corretorUserId && stuppIds.has(corretor.corretorUserId)) {
          idsInRoletas.add(corretor.corretorUserId)
        }
      }
    }

    return (orgPreview?.corretores ?? [])
      .filter((corretor) => idsInRoletas.has(corretor.id))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  }, [data?.roletas, orgPreview?.corretores, orgPreview?.org.allUserIds])

  const roletasByOrg = useMemo(() => {
    return filterRoletas(
      data?.roletas ?? [],
      {
        diretoriaId: appliedCatalogFilters.diretoriaId,
        liderancaId: appliedCatalogFilters.liderancaId,
        corretorId: appliedCatalogFilters.corretorId,
        roletaId: '',
        status: 'todas',
      },
      { liderancaTeam: selectedLiderancaTeam }
    )
  }, [
    data?.roletas,
    appliedCatalogFilters.diretoriaId,
    appliedCatalogFilters.liderancaId,
    appliedCatalogFilters.corretorId,
    selectedLiderancaTeam,
  ])

  const filteredRoletas = useMemo(() => {
    return filterRoletas(roletasByOrg, {
      diretoriaId: '',
      liderancaId: '',
      corretorId: '',
      roletaId: appliedCatalogFilters.roletaId,
      status: appliedCatalogFilters.status,
    })
  }, [roletasByOrg, appliedCatalogFilters.roletaId, appliedCatalogFilters.status])

  const statusCounts = useMemo(() => {
    const groups = groupRoletasByStatus(roletasByOrg)
    return {
      ativa: groups.ativa.length,
      nova: groups.nova.length,
      suspensa: groups.suspensa.length,
    } satisfies Record<RoletaOperationalStatus, number>
  }, [roletasByOrg])

  const diretoriaOptions = catalog?.diretorias ?? []
  const roletaOptions = useMemo(
    () => (data?.roletas ?? []).map((item) => ({ id: item.id, title: item.title })),
    [data?.roletas]
  )

  const corretorManageOptions = orgPreview?.corretores ?? []

  const isInitialLoading = catalogLoading && !catalog
  const isError = catalogError && !catalog
  const error = catalogErrorObj

  function handleDiretoriaChange(value: string) {
    setDraftCatalogFilters((prev) => ({
      ...prev,
      diretoriaId: value,
      liderancaId: '',
    }))
  }

  function handleApplyCatalogFilters() {
    setAppliedCatalogFilters(draftCatalogFilters)
  }

  return (
    <>
      <RoletasFilters />

      <PageShell>
        {isInitialLoading ? (
          <LoadingState message="Carregando catálogo de roletas..." />
        ) : isError ? (
          <ErrorState title="Erro ao carregar roletas">
            {(error as Error)?.message?.includes('pausada temporariamente')
              ? 'A integração com o Bitrix está pausada para reduzir carga no webhook. Tente novamente mais tarde.'
              : (error as Error)?.message?.includes('operation time limit')
                ? 'O Bitrix está temporariamente sobrecarregado. Aguarde alguns minutos e clique em Atualizar.'
                : 'Verifique o webhook no arquivo .env'}
          </ErrorState>
        ) : (
          <>
            <PageHeader
              badge="Roletas Stüpp"
              title="Distribuição de roletas"
              subtitle="Filtre por diretoria ou liderança para ver em quais roletas os corretores cadastrados estão presentes."
            />

            <FilterApplyingOverlay isActive={isApplyingFilters}>
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <KPICard
                    label="Roletas ativas"
                    value={statusCounts.ativa}
                    color="emerald"
                    icon={CircleDot}
                  />
                  <KPICard
                    label="Roletas novas"
                    value={statusCounts.nova}
                    color="brand"
                    icon={Sparkles}
                  />
                  <KPICard
                    label="Roletas suspensas"
                    value={statusCounts.suspensa}
                    color="default"
                    icon={PauseCircle}
                  />
                  <KPICard
                    label="Leads no período"
                    value={statsLoading ? undefined : (data?.totalLeads ?? 0)}
                    color="indigo"
                  />
                </div>

                <ChartCard
                  title="Catálogo de roletas"
                  description={
                    statsLoading
                      ? 'Listagem pronta — carregando volumes de leads do período...'
                      : 'Corretores vêm da aba “Corretores da roleta” no Bitrix'
                  }
                >
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <CorretorRoletaSearchFilter
                        value={draftCatalogFilters.corretorId}
                        options={corretorSearchOptions}
                        onChange={(value) =>
                          setDraftCatalogFilters((prev) => ({ ...prev, corretorId: value }))
                        }
                        isLoading={orgLoading}
                      />
                      <DiretoriaRoletaFilter
                        value={draftCatalogFilters.diretoriaId}
                        options={diretoriaOptions}
                        onChange={handleDiretoriaChange}
                      />
                      <LiderancaRoletaFilter
                        value={draftCatalogFilters.liderancaId}
                        options={liderancaOptions}
                        onChange={(value) =>
                          setDraftCatalogFilters((prev) => ({ ...prev, liderancaId: value }))
                        }
                      />
                      <RoletaNomeFilter
                        value={draftCatalogFilters.roletaId}
                        options={roletaOptions}
                        onChange={(value) =>
                          setDraftCatalogFilters((prev) => ({ ...prev, roletaId: value }))
                        }
                      />
                    </div>

                    <RoletaStatusFilterBar
                      value={draftCatalogFilters.status}
                      counts={statusCounts}
                      total={roletasByOrg.length}
                      onChange={(value) =>
                        setDraftCatalogFilters((prev) => ({ ...prev, status: value }))
                      }
                    />

                    <div className="flex justify-end">
                      <ApplyRoletasCatalogFiltersButton
                        draft={draftCatalogFilters}
                        applied={appliedCatalogFilters}
                        onApply={handleApplyCatalogFilters}
                      />
                    </div>

                    <RoletasList
                      roletas={filteredRoletas}
                      filters={appliedCatalogFilters}
                      liderancaTeam={selectedLiderancaTeam}
                      corretorOptions={corretorManageOptions}
                      statsLoading={statsLoading}
                    />
                  </div>
                </ChartCard>
              </div>
            </FilterApplyingOverlay>
          </>
        )}
      </PageShell>
    </>
  )
}
