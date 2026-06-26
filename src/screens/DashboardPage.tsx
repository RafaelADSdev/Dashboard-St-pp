'use client'

import { useAppliedFilters } from '@/store/filterStore'
import { DateRangeFilter } from '@/components/filters/DateRangeFilter'
import { EsteiraFilter } from '@/components/filters/EsteiraFilter'
import { DiretoriaFilter } from '@/components/filters/DiretoriaFilter'
import { ApplyFiltersButton } from '@/components/filters/ApplyFiltersButton'
import { EquipeFilter } from '@/components/filters/EquipeFilter'
import { LeadsByTeamPanel } from '@/components/charts/LeadsByTeamPanel'
import { LeadsByStageChart } from '@/components/charts/LeadsByStageChart'
import { LeadsOverTimeChart } from '@/components/charts/LeadsOverTimeChart'
import { PipelineFunnelChart } from '@/components/charts/PipelineFunnelChart'
import { KPICard } from '@/components/cards/KPICard'
import { useLeadsData } from '@/hooks/useLeadsData'
import { PageShell } from '@/components/ui/PageShell'
import { PageHeader } from '@/components/ui/PageHeader'
import { FilterPanel } from '@/components/ui/FilterPanel'
import { ChartCard } from '@/components/ui/ChartCard'
import { ErrorState, LoadingState } from '@/components/ui/StatusMessage'

export function DashboardPage() {
  const applied = useAppliedFilters()
  const { data, isLoading, isError, error } = useLeadsData(applied)

  if (isLoading) {
    return (
      <PageShell>
        <LoadingState message="Carregando leads da Superintendência Stüpp..." />
      </PageShell>
    )
  }

  if (isError) {
    return (
      <PageShell>
        <ErrorState title="Erro ao carregar dados do Bitrix">
          {(error as Error)?.message?.includes('operation time limit')
            ? 'O Bitrix está temporariamente sobrecarregado. Aguarde alguns minutos e clique em Atualizar.'
            : 'Verifique o webhook no arquivo .env'}
        </ErrorState>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <PageHeader
        badge="Superintendência Stüpp"
        title="Visão geral comercial"
        subtitle="Acompanhe leads e negociações das esteiras Comercial Geral e Comercial Econômico."
      />

      <FilterPanel>
        <DateRangeFilter />
        <EsteiraFilter />
        <DiretoriaFilter />
        <EquipeFilter />
        <ApplyFiltersButton />
      </FilterPanel>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard label="Total de leads" value={data?.totalLeads ?? 0} color="brand" />
        <KPICard label="Comercial Econômico" value={data?.economicoCount ?? 0} color="indigo" />
        <KPICard label="Comercial Geral" value={data?.geralCount ?? 0} color="emerald" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <ChartCard title="Leads por equipe" description="Escolha uma diretoria ou equipe para ver os detalhes">
          <LeadsByTeamPanel
            byDiretoria={data?.byDiretoria ?? []}
            teamDetails={data?.teamDetails ?? []}
          />
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

      <ChartCard title="Leads por fase do funil" description="Volume em cada estágio do CRM">
        <LeadsByStageChart data={data?.byStage ?? []} />
      </ChartCard>
    </PageShell>
  )
}
