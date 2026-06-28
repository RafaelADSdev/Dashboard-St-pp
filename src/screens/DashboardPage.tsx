'use client'

import { useAppliedFilters } from '@/store/filterStore'
import { DateRangeFilter } from '@/components/filters/DateRangeFilter'
import { EsteiraFilter } from '@/components/filters/EsteiraFilter'
import { DiretoriaFilter } from '@/components/filters/DiretoriaFilter'
import { EquipeFilter } from '@/components/filters/EquipeFilter'
import { RoletaFilter } from '@/components/filters/RoletaFilter'
import { LeadsByTeamPanel } from '@/components/charts/LeadsByTeamPanel'
import { LeadsBySourceChart } from '@/components/charts/LeadsBySourceChart'
import { LeadsOverTimeChart } from '@/components/charts/LeadsOverTimeChart'
import { PipelineFunnelChart } from '@/components/charts/PipelineFunnelChart'
import { KPICard } from '@/components/cards/KPICard'
import { useLeadsData } from '@/hooks/useLeadsData'
import { PageShell } from '@/components/ui/PageShell'
import { PageHeader } from '@/components/ui/PageHeader'
import { FilterPanel } from '@/components/ui/FilterPanel'
import { ChartCard } from '@/components/ui/ChartCard'
import { FilterApplyingOverlay } from '@/components/ui/FilterApplyingOverlay'
import { ErrorState, LoadingState } from '@/components/ui/StatusMessage'
import { useFilterApplyFeedback } from '@/hooks/useFilterApplyFeedback'

function DashboardFilters() {
  return (
    <FilterPanel>
      <DateRangeFilter />
      <EsteiraFilter />
      <DiretoriaFilter />
      <EquipeFilter />
      <RoletaFilter />
    </FilterPanel>
  )
}

export function DashboardPage() {
  const applied = useAppliedFilters()
  const { data, isLoading, isFetching, isPending, isError, error } = useLeadsData(applied)
  const isApplyingFilters = useFilterApplyFeedback(isFetching || isPending)

  return (
    <>
      <DashboardFilters />

      <PageShell>
        {isLoading && !data ? (
          <LoadingState message="Carregando leads da Superintendência Stüpp..." />
        ) : isError ? (
          <ErrorState title="Erro ao carregar dados do Bitrix">
            {(error as Error)?.message?.includes('operation time limit')
              ? 'O Bitrix está temporariamente sobrecarregado. Aguarde alguns minutos e clique em Atualizar.'
              : 'Verifique o webhook no arquivo .env'}
          </ErrorState>
        ) : (
          <>
            <PageHeader
              badge="Superintendência Stüpp"
              title="Visão geral comercial"
              subtitle="Acompanhe leads e negociações das esteiras Comercial Geral e Comercial Econômico."
            />

            <FilterApplyingOverlay isActive={isApplyingFilters}>
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <KPICard label="Total de leads" value={data?.totalLeads ?? 0} color="brand" />
                  <KPICard label="Comercial Econômico" value={data?.economicoCount ?? 0} color="indigo" />
                  <KPICard label="Comercial Geral" value={data?.geralCount ?? 0} color="emerald" />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  <ChartCard title="Leads por equipe" description="Resumo por diretoria">
                    <LeadsByTeamPanel byDiretoria={data?.byDiretoria ?? []} />
                  </ChartCard>
                  <ChartCard title="Evolução no período" description="Comparativo diário entre esteiras">
                    <LeadsOverTimeChart data={data?.overTime ?? []} />
                  </ChartCard>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  <ChartCard title="Funil — Comercial Econômico" description="Etapas do pipeline econômico">
                    <PipelineFunnelChart data={data?.funnelEconomico ?? []} />
                  </ChartCard>
                  <ChartCard title="Funil — Comercial Geral" description="Etapas do pipeline geral">
                    <PipelineFunnelChart data={data?.funnelGeral ?? []} />
                  </ChartCard>
                </div>

                <ChartCard title="Leads por origem" description="Fonte de captação no CRM">
                  <LeadsBySourceChart data={data?.bySource ?? []} />
                </ChartCard>
              </div>
            </FilterApplyingOverlay>
          </>
        )}
      </PageShell>
    </>
  )
}
