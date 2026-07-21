import type { StuppOrgStructure } from '@/api/bitrixDepartments'
import type { StuppRoleta } from '@/api/bitrixRoletas'
import type { RoletaMembership } from '@/api/bitrixRoletaCorretores'
import type { StageCatalog } from '@/api/bitrixStages'
import type { BitrixLead, FilterParams } from '@/api/types'
import type { RoletaOperationalStatus } from '@/lib/roletaStatus'
import { createAdminClient } from '@/lib/supabase/admin'

export const BITRIX_METADATA_SNAPSHOT_KEY = 'dashboard_metadata_v1'
const PAGE_SIZE = 1_000

export interface SyncedBitrixMetadata {
  org: StuppOrgStructure
  stageCatalog: StageCatalog
  roletasCatalog: StuppRoleta[]
  roletaMembership: {
    membershipByRoletaId: Record<string, RoletaMembership>
    diretorias: { id: string; name: string; leaderName?: string }[]
  }
  sourceLabels: Record<string, string>
}

export interface BitrixSyncState {
  status: 'idle' | 'running' | 'success' | 'error'
  started_at: string | null
  completed_at: string | null
  coverage_start: string | null
  last_error: string | null
  details: Record<string, unknown>
}

type DealRow = Omit<BitrixLead, 'date_create' | 'date_modify' | 'date_arrived' | 'date_last_movement'> & {
  date_create: string | null
  date_modify: string | null
  date_arrived: string
  date_last_movement: string | null
}

function messageForMissingSync() {
  return (
    'O Supabase ainda não possui uma sincronização válida do Bitrix. ' +
    'Aplique as migrations e execute /api/cron/sync-bitrix antes de abrir o dashboard.'
  )
}

export async function getBitrixSyncState(): Promise<BitrixSyncState> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('bitrix_sync_state')
    .select('status,started_at,completed_at,coverage_start,last_error,details')
    .eq('id', 'main')
    .maybeSingle()

  if (error) {
    throw new Error(`Falha ao consultar o estado da sincronização no Supabase: ${error.message}`)
  }
  if (!data) throw new Error(messageForMissingSync())

  return data as BitrixSyncState
}

export async function getSyncedBitrixMetadata(): Promise<SyncedBitrixMetadata> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('bitrix_sync_snapshots')
    .select('payload')
    .eq('key', BITRIX_METADATA_SNAPSHOT_KEY)
    .maybeSingle()

  if (error) {
    throw new Error(`Falha ao ler os metadados sincronizados no Supabase: ${error.message}`)
  }
  if (!data?.payload) throw new Error(messageForMissingSync())

  return data.payload as SyncedBitrixMetadata
}

export async function saveSyncedBitrixMetadata(
  metadata: SyncedBitrixMetadata
): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('bitrix_sync_snapshots').upsert(
    {
      key: BITRIX_METADATA_SNAPSHOT_KEY,
      payload: metadata,
      synced_at: new Date().toISOString(),
    },
    { onConflict: 'key' }
  )

  if (error) {
    throw new Error(`Falha ao atualizar os metadados no Supabase: ${error.message}`)
  }
}

export async function patchSyncedRoletaStatus(
  roletaId: string,
  status: RoletaOperationalStatus,
  stageId: string
): Promise<void> {
  const metadata = await getSyncedBitrixMetadata()
  metadata.roletasCatalog = metadata.roletasCatalog.map((roleta) =>
    roleta.id === roletaId
      ? { ...roleta, status, stageId, isActive: status === 'ativa' }
      : roleta
  )
  await saveSyncedBitrixMetadata(metadata)
}

export async function assertSyncedDateCoverage(dateFrom: string): Promise<BitrixSyncState> {
  const state = await getBitrixSyncState()

  if (!state.completed_at || !state.coverage_start) {
    throw new Error(messageForMissingSync())
  }
  if (dateFrom < state.coverage_start) {
    throw new Error(
      `O período solicitado começa antes do histórico sincronizado (${state.coverage_start}). ` +
        'Ajuste BITRIX_SYNC_START_DATE e execute uma sincronização completa.'
    )
  }

  return state
}

function rowToLead(row: DealRow, org: StuppOrgStructure): BitrixLead {
  const assignedById = String(row.assigned_by_id ?? '')
  const modifiedById = String(row.modified_by_id ?? '')

  return {
    id: String(row.id),
    title: row.title ?? '',
    assigned_by_id: assignedById,
    assigned_by_name:
      org.userToName[assignedById] ?? row.assigned_by_name ?? `Usuário #${assignedById}`,
    equipe: org.userToTeamName[assignedById] ?? row.equipe ?? 'Sem equipe',
    diretoria: org.userToDiretoriaName[assignedById] ?? row.diretoria ?? 'Outros',
    stage_id: row.stage_id ?? '',
    category_id: row.category_id ?? '',
    date_create: row.date_create ?? '',
    date_modify: row.date_modify ?? '',
    date_arrived: row.date_arrived ?? '',
    date_last_movement: row.date_last_movement ?? '',
    modified_by_id: modifiedById,
    modified_by_name:
      org.userToName[modifiedById] ?? row.modified_by_name ?? `Usuário #${modifiedById}`,
    source_id: row.source_id ?? '',
    roleta: row.roleta ?? '',
  }
}

export async function fetchSyncedLeads(
  filters: FilterParams,
  categoryIds: string[],
  org: StuppOrgStructure,
  options: { assignedByIds?: string[]; roletaTitle?: string } = {}
): Promise<BitrixLead[]> {
  await assertSyncedDateCoverage(filters.dateFrom)

  const namedStuppUserIds = org.allUserIds.filter((userId) => {
    const diretoria = org.userToDiretoriaName[String(userId)]?.trim()
    return Boolean(diretoria && diretoria !== 'Outros')
  })
  const allowedUserIds = new Set(namedStuppUserIds)
  const scopedAssignedByIds = options.assignedByIds?.filter((userId) =>
    allowedUserIds.has(String(userId))
  )
  if (options.assignedByIds && scopedAssignedByIds?.length === 0) return []

  const namedDiretorias = [
    ...new Set(
      namedStuppUserIds
        .map((userId) => org.userToDiretoriaName[String(userId)]?.trim())
        .filter(
          (diretoria): diretoria is string =>
            Boolean(diretoria && diretoria !== 'Outros')
        )
    ),
  ]
  if (!scopedAssignedByIds && namedDiretorias.length === 0) return []

  const supabase = createAdminClient()
  const rows: DealRow[] = []
  let from = 0

  while (true) {
    let query = supabase
      .from('bitrix_deals')
      .select(
        'id,title,assigned_by_id,assigned_by_name,equipe,diretoria,stage_id,category_id,date_create,date_modify,date_arrived,date_last_movement,modified_by_id,modified_by_name,source_id,roleta'
      )
      .gte('date_arrived', `${filters.dateFrom}T00:00:00.000-03:00`)
      .lte('date_arrived', `${filters.dateTo}T23:59:59.999-03:00`)
      .in('category_id', categoryIds)
      .order('date_arrived', { ascending: true })
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)

    query = scopedAssignedByIds
      ? query.in('assigned_by_id', scopedAssignedByIds)
      : query.in('diretoria', namedDiretorias)
    if (options.roletaTitle) {
      query = query.eq('roleta', options.roletaTitle)
    }

    const { data, error } = await query
    if (error) {
      throw new Error(`Falha ao consultar os leads no Supabase: ${error.message}`)
    }

    const page = (data ?? []) as DealRow[]
    rows.push(...page)
    if (page.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  return rows.map((row) => rowToLead(row, org))
}

export async function patchSyncedDeal(
  dealId: string,
  changes: Partial<Pick<DealRow, 'stage_id' | 'assigned_by_id'>>
): Promise<void> {
  const supabase = createAdminClient()
  const now = new Date().toISOString()
  const { error } = await supabase
    .from('bitrix_deals')
    .update({ ...changes, date_modify: now, synced_at: now })
    .eq('id', dealId)

  if (error) {
    throw new Error(`Bitrix atualizado, mas o espelho no Supabase falhou: ${error.message}`)
  }
}

export async function patchSyncedDealsAssignee(
  dealIds: string[],
  assignedById: string
): Promise<void> {
  if (dealIds.length === 0) return

  const supabase = createAdminClient()
  const now = new Date().toISOString()
  const { error } = await supabase
    .from('bitrix_deals')
    .update({ assigned_by_id: assignedById, date_modify: now, synced_at: now })
    .in('id', dealIds)

  if (error) {
    throw new Error(`Bitrix atualizado, mas o espelho no Supabase falhou: ${error.message}`)
  }
}
