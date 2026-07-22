import { randomUUID } from 'node:crypto'
import {
  fetchLeadsFromBitrix,
  fetchLeadsModifiedFromBitrix,
  fetchSourceLabels,
  fetchStageDefinitions,
  type BitrixLead,
} from '@/api/bitrix'
import { getCategoryIdsForEsteira, ESTEIRA_ECONOMICO_ID, ESTEIRA_GERAL_ID } from '@/api/bitrixConfig'
import { fetchStuppOrgStructure } from '@/api/bitrixDepartments'
import {
  attachMembershipToRoletaIds,
  buildRoletaMembershipIndex,
  fetchRoletaCorretorItems,
} from '@/api/bitrixRoletaCorretores'
import {
  fetchRoletaCorretorListItems,
} from '@/api/bitrixRoletaCorretoresList'
import { fetchStuppRoletasCatalog } from '@/api/bitrixRoletas'
import { buildStageLabels, type StageCatalog } from '@/api/bitrixStages'
import { createAdminClient } from '@/lib/supabase/admin'
import { getDealsBitrixWebhookCandidates, getMetaBitrixWebhookCandidates } from './bitrixWebhook'
import {
  BITRIX_METADATA_SNAPSHOT_KEY,
  getBitrixSyncState,
  getSyncedBitrixMetadata,
  saveSyncedBitrixMetadata,
  type SyncedBitrixMetadata,
} from './supabaseBitrixData'

const UPSERT_CHUNK_SIZE = 500
const DEFAULT_SYNC_START_DATE = '2026-06-01'
const DEFAULT_OVERLAP_MINUTES = 60
const LOCK_SECONDS = 25 * 60
const BACKFILL_WINDOW_DAYS = 7

type BitrixSyncMode = 'bootstrap' | 'incremental' | 'incremental+backfill' | 'reconcile'

interface StoredBackfillProgress {
  status: 'running' | 'completed'
  startDate: string
  targetDate: string
  nextDate: string
  lastWindowFrom?: string
  lastWindowTo?: string
  lastDealsSynced?: number
}

interface BitrixBackfillResult extends StoredBackfillProgress {
  windowFrom?: string
  windowTo?: string
  dealsSynced: number
}

export interface BitrixSyncResult {
  ok: true
  skipped: boolean
  mode: BitrixSyncMode
  dealsSynced: number
  coverageStart: string
  completedAt: string
  backfill?: BitrixBackfillResult
  reconciliation?: {
    dateFrom: string
    dateTo: string
    dealsRemoved: number
  }
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  return new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value
}

function addUtcDays(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function formatSaoPauloDate(value: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value)
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${byType.year}-${byType.month}-${byType.day}`
}

function readSyncStartDate(): string {
  const value = process.env.BITRIX_SYNC_START_DATE?.trim() || DEFAULT_SYNC_START_DATE
  if (!isIsoDate(value)) {
    throw new Error('BITRIX_SYNC_START_DATE deve usar o formato YYYY-MM-DD')
  }
  return value
}

function readBackfillProgress(
  details: Record<string, unknown>,
  startDate: string,
  targetDate: string,
  restart: boolean
): StoredBackfillProgress {
  const raw = details.backfill
  if (!restart && raw && typeof raw === 'object') {
    const stored = raw as Partial<StoredBackfillProgress>
    if (
      stored.status === 'running' &&
      stored.startDate === startDate &&
      stored.targetDate === targetDate &&
      isIsoDate(stored.nextDate) &&
      stored.nextDate >= startDate &&
      stored.nextDate <= targetDate
    ) {
      return stored as StoredBackfillProgress
    }
  }

  return {
    status: 'running',
    startDate,
    targetDate,
    nextDate: startDate,
  }
}

function readOverlapMinutes(): number {
  const value = Number(process.env.BITRIX_SYNC_OVERLAP_MINUTES ?? DEFAULT_OVERLAP_MINUTES)
  return Number.isFinite(value) && value >= 5 ? Math.floor(value) : DEFAULT_OVERLAP_MINUTES
}

function toDealRow(lead: BitrixLead, syncedAt: string) {
  return {
    id: lead.id,
    title: lead.title,
    assigned_by_id: lead.assigned_by_id,
    assigned_by_name: lead.assigned_by_name,
    equipe: lead.equipe,
    diretoria: lead.diretoria,
    stage_id: lead.stage_id,
    category_id: lead.category_id,
    date_create: lead.date_create || null,
    date_modify: lead.date_modify || null,
    date_arrived: lead.date_arrived,
    date_last_movement: lead.date_last_movement || null,
    modified_by_id: lead.modified_by_id,
    modified_by_name: lead.modified_by_name,
    source_id: lead.source_id,
    roleta: lead.roleta,
    synced_at: syncedAt,
  }
}

async function upsertDeals(leads: BitrixLead[], syncedAt: string): Promise<void> {
  const supabase = createAdminClient()

  for (let index = 0; index < leads.length; index += UPSERT_CHUNK_SIZE) {
    const rows = leads
      .slice(index, index + UPSERT_CHUNK_SIZE)
      .filter((lead) => Boolean(lead.id && lead.date_arrived))
      .map((lead) => toDealRow(lead, syncedAt))

    if (rows.length === 0) continue

    const { error } = await supabase.from('bitrix_deals').upsert(rows, { onConflict: 'id' })
    if (error) {
      throw new Error(`Falha ao gravar negócios no Supabase: ${error.message}`)
    }
  }
}

async function deleteSyncedDeals(dealIds: string[]): Promise<void> {
  if (dealIds.length === 0) return

  const supabase = createAdminClient()
  const uniqueIds = [...new Set(dealIds.filter(Boolean))]

  for (let index = 0; index < uniqueIds.length; index += UPSERT_CHUNK_SIZE) {
    const { error } = await supabase
      .from('bitrix_deals')
      .delete()
      .in('id', uniqueIds.slice(index, index + UPSERT_CHUNK_SIZE))

    if (error) {
      throw new Error(`Falha ao remover negócios fora da Stüpp: ${error.message}`)
    }
  }
}

async function getSyncedDealIdsInRange(
  dateFrom: string,
  dateTo: string,
  categoryIds: string[]
): Promise<string[]> {
  const supabase = createAdminClient()
  const ids: string[] = []
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from('bitrix_deals')
      .select('id')
      .gte('date_arrived', dateFrom + 'T00:00:00.000-03:00')
      .lte('date_arrived', dateTo + 'T23:59:59.999-03:00')
      .in('category_id', categoryIds)
      .order('id')
      .range(from, from + 999)

    if (error) {
      throw new Error('Falha ao conferir o intervalo no Supabase: ' + error.message)
    }

    const page = (data ?? []).map((row) => String(row.id))
    ids.push(...page)
    if (page.length < 1_000) break
    from += 1_000
  }

  return ids
}

function splitLeadsByStuppScope(leads: BitrixLead[], stuppUserIds: string[]) {
  const allowedUserIds = new Set(stuppUserIds.map(String))
  const included: BitrixLead[] = []
  const excluded: BitrixLead[] = []

  for (const lead of leads) {
    if (allowedUserIds.has(String(lead.assigned_by_id))) included.push(lead)
    else excluded.push(lead)
  }

  return { included, excluded }
}

function getNamedStuppUserIds(metadata: SyncedBitrixMetadata): string[] {
  return metadata.org.allUserIds.filter((userId) => {
    const diretoria = metadata.org.userToDiretoriaName[String(userId)]?.trim()
    return Boolean(diretoria && diretoria !== 'Outros')
  })
}

function isLeadInsideConfiguredHistory(lead: BitrixLead, startDate: string): boolean {
  const arrivedDate = String(lead.date_arrived ?? '').match(/^\d{4}-\d{2}-\d{2}/)?.[0]
  return Boolean(arrivedDate && arrivedDate >= startDate)
}

async function loadMetadataFromBitrix(): Promise<SyncedBitrixMetadata> {
  const metaWebhooks = getMetaBitrixWebhookCandidates()
  const org = await fetchStuppOrgStructure(metaWebhooks)
  const geralStages = await fetchStageDefinitions(metaWebhooks, ESTEIRA_GERAL_ID)
  const economicoStages = await fetchStageDefinitions(metaWebhooks, ESTEIRA_ECONOMICO_ID)
  const sourceLabels = await fetchSourceLabels(metaWebhooks)
  const roletasCatalog = await fetchStuppRoletasCatalog(metaWebhooks, org)
  const roletaTitles = roletasCatalog.map((roleta) => roleta.title)
  const corretorItems = await fetchRoletaCorretorItems(metaWebhooks, roletaTitles)
  const listItems = await fetchRoletaCorretorListItems(metaWebhooks, roletaTitles)
  const membershipIndex = buildRoletaMembershipIndex(corretorItems, org, {
    listItems,
    roletas: roletasCatalog.map((roleta) => ({ id: roleta.id, title: roleta.title })),
  })
  const membershipByRoletaId = attachMembershipToRoletaIds(
    membershipIndex,
    roletasCatalog.map((roleta) => ({ id: roleta.id, title: roleta.title }))
  )

  const stageCatalog: StageCatalog = {
    geral: geralStages,
    economico: economicoStages,
    labels: {
      ...buildStageLabels(geralStages),
      ...buildStageLabels(economicoStages),
    },
  }

  return {
    org,
    stageCatalog,
    roletasCatalog,
    roletaMembership: {
      membershipByRoletaId,
      diretorias: org.diretorias.map((diretoria) => ({
        id: diretoria.id,
        name: diretoria.name,
        leaderName: diretoria.leaderName,
      })),
    },
    sourceLabels,
  }
}

export async function refreshSyncedRoletaMembership(): Promise<void> {
  const metadata = await getSyncedBitrixMetadata()
  const metaWebhooks = getMetaBitrixWebhookCandidates()
  const corretorItems = await fetchRoletaCorretorItems(
    metaWebhooks,
    metadata.roletasCatalog.map((roleta) => roleta.title)
  )
  const listItems = await fetchRoletaCorretorListItems(
    metaWebhooks,
    metadata.roletasCatalog.map((roleta) => roleta.title)
  )
  const membershipIndex = buildRoletaMembershipIndex(corretorItems, metadata.org, {
    listItems,
    roletas: metadata.roletasCatalog.map((roleta) => ({
      id: roleta.id,
      title: roleta.title,
    })),
  })
  const membershipByRoletaId = attachMembershipToRoletaIds(
    membershipIndex,
    metadata.roletasCatalog.map((roleta) => ({ id: roleta.id, title: roleta.title }))
  )

  metadata.roletaMembership = {
    ...metadata.roletaMembership,
    membershipByRoletaId,
  }
  await saveSyncedBitrixMetadata(metadata)
}

async function finishSync(
  owner: string,
  input: {
    success: boolean
    coverageStart?: string
    details?: Record<string, unknown>
    error?: string
  }
) {
  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('finish_bitrix_sync', {
    p_owner: owner,
    p_success: input.success,
    p_coverage_start: input.coverageStart ?? null,
    p_details: input.details ?? {},
    p_error: input.error ?? null,
  })
  if (error) throw new Error(`Falha ao finalizar a sincronização: ${error.message}`)
  if (!data) throw new Error('A sincronização perdeu o lock antes de ser finalizada')
}

export async function syncBitrixToSupabase(
  options: {
    forceFull?: boolean
    reconcileFrom?: string
    reconcileTo?: string
  } = {}
): Promise<BitrixSyncResult> {
  const supabase = createAdminClient()
  const owner = randomUUID()
  const syncStartDate = readSyncStartDate()
  const { data: claimed, error: claimError } = await supabase.rpc('claim_bitrix_sync', {
    p_owner: owner,
    p_lock_seconds: LOCK_SECONDS,
  })

  if (claimError) {
    throw new Error(`Não foi possível iniciar a sincronização: ${claimError.message}`)
  }

  if (!claimed) {
    const state = await getBitrixSyncState()
    return {
      ok: true,
      skipped: true,
      mode: 'incremental',
      dealsSynced: 0,
      coverageStart: state.coverage_start ?? syncStartDate,
      completedAt: state.completed_at ?? new Date().toISOString(),
    }
  }

  try {
    const state = await getBitrixSyncState()
    const metadata = await loadMetadataFromBitrix()
    const now = new Date()
    const nowIso = now.toISOString()
    const dateTo = formatSaoPauloDate(now)
    const dealsWebhooks = getDealsBitrixWebhookCandidates()
    const categoryIds = getCategoryIdsForEsteira('TODAS')
    const scopedStuppUserIds = getNamedStuppUserIds(metadata)
    const reconcileFrom = options.reconcileFrom?.trim()
    const reconcileTo = options.reconcileTo?.trim()

    if (Boolean(reconcileFrom) !== Boolean(reconcileTo)) {
      throw new Error('Informe reconcileFrom e reconcileTo juntos')
    }

    if (reconcileFrom && reconcileTo) {
      if (!isIsoDate(reconcileFrom) || !isIsoDate(reconcileTo)) {
        throw new Error('O intervalo de reconciliação deve usar o formato YYYY-MM-DD')
      }
      if (reconcileFrom < syncStartDate || reconcileFrom > reconcileTo || reconcileTo > dateTo) {
        throw new Error(
          'O intervalo de reconciliação deve ficar entre ' + syncStartDate + ' e ' + dateTo
        )
      }

      const reconciledLeads = await fetchLeadsFromBitrix(dealsWebhooks, {
        dateFrom: reconcileFrom,
        dateTo: reconcileTo,
        categoryIds,
        userToTeamName: metadata.org.userToTeamName,
        userToDiretoriaName: metadata.org.userToDiretoriaName,
        userNames: metadata.org.userToName,
      })
      const scopedLeads = splitLeadsByStuppScope(
        reconciledLeads,
        scopedStuppUserIds
      ).included
      const currentIds = new Set(scopedLeads.map((lead) => lead.id))
      const storedIds = await getSyncedDealIdsInRange(
        reconcileFrom,
        reconcileTo,
        categoryIds
      )
      const staleIds = storedIds.filter((id) => !currentIds.has(id))

      await upsertDeals(scopedLeads, nowIso)
      await deleteSyncedDeals(staleIds)
      await saveSyncedBitrixMetadata(metadata)

      const details = {
        ...state.details,
        mode: 'reconcile',
        dealsSynced: scopedLeads.length,
        dealsRemovedOutsideScope: staleIds.length,
        reconciliation: {
          dateFrom: reconcileFrom,
          dateTo: reconcileTo,
          completedAt: nowIso,
        },
      }
      const coverageStart = state.coverage_start ?? syncStartDate
      await finishSync(owner, { success: true, coverageStart, details })

      return {
        ok: true,
        skipped: false,
        mode: 'reconcile',
        dealsSynced: scopedLeads.length,
        coverageStart,
        completedAt: nowIso,
        reconciliation: {
          dateFrom: reconcileFrom,
          dateTo: reconcileTo,
          dealsRemoved: staleIds.length,
        },
      }
    }

    const bootstrap = !state.completed_at
    const rawCurrentLeads = bootstrap
      ? await fetchLeadsFromBitrix(dealsWebhooks, {
          dateFrom: dateTo,
          dateTo,
          categoryIds,
          userToTeamName: metadata.org.userToTeamName,
          userToDiretoriaName: metadata.org.userToDiretoriaName,
          userNames: metadata.org.userToName,
        })
      : await fetchLeadsModifiedFromBitrix(dealsWebhooks, {
          modifiedFrom: new Date(
            new Date(state.completed_at!).getTime() - readOverlapMinutes() * 60_000
          ).toISOString(),
          modifiedTo: nowIso,
          categoryIds,
          userToTeamName: metadata.org.userToTeamName,
          userToDiretoriaName: metadata.org.userToDiretoriaName,
          userNames: metadata.org.userToName,
        })

    const currentScope = splitLeadsByStuppScope(rawCurrentLeads, scopedStuppUserIds)
    const currentLeads = currentScope.included.filter((lead) =>
      isLeadInsideConfiguredHistory(lead, syncStartDate)
    )
    const currentExcluded = [
      ...currentScope.excluded,
      ...currentScope.included.filter(
        (lead) => !isLeadInsideConfiguredHistory(lead, syncStartDate)
      ),
    ]
    await upsertDeals(currentLeads, nowIso)
    await deleteSyncedDeals(currentExcluded.map((lead) => lead.id))

    const coverageBefore = state.coverage_start ?? dateTo
    let coverageStart = coverageBefore
    let backfill: BitrixBackfillResult | undefined
    let storedBackfill: StoredBackfillProgress | undefined

    if (syncStartDate < coverageBefore) {
      const progress = readBackfillProgress(
        state.details,
        syncStartDate,
        coverageBefore,
        Boolean(options.forceFull)
      )
      const windowFrom = progress.nextDate
      const lastMissingDate = addUtcDays(coverageBefore, -1)
      const windowTo = [addUtcDays(windowFrom, BACKFILL_WINDOW_DAYS - 1), lastMissingDate].sort()[0]
      const rawHistoricalLeads = await fetchLeadsFromBitrix(dealsWebhooks, {
        dateFrom: windowFrom,
        dateTo: windowTo,
        categoryIds,
        userToTeamName: metadata.org.userToTeamName,
        userToDiretoriaName: metadata.org.userToDiretoriaName,
        userNames: metadata.org.userToName,
      })
      const historicalLeads = splitLeadsByStuppScope(
        rawHistoricalLeads,
        scopedStuppUserIds
      ).included

      await upsertDeals(historicalLeads, nowIso)

      const nextDate = addUtcDays(windowTo, 1)
      const backfillCompleted = nextDate >= coverageBefore
      storedBackfill = {
        status: backfillCompleted ? 'completed' : 'running',
        startDate: syncStartDate,
        targetDate: coverageBefore,
        nextDate,
        lastWindowFrom: windowFrom,
        lastWindowTo: windowTo,
        lastDealsSynced: historicalLeads.length,
      }
      backfill = {
        ...storedBackfill,
        windowFrom,
        windowTo,
        dealsSynced: historicalLeads.length,
      }

      if (backfillCompleted) coverageStart = syncStartDate
    }

    const { error: snapshotError } = await supabase.from('bitrix_sync_snapshots').upsert(
      {
        key: BITRIX_METADATA_SNAPSHOT_KEY,
        payload: metadata,
        synced_at: nowIso,
      },
      { onConflict: 'key' }
    )
    if (snapshotError) {
      throw new Error(`Falha ao gravar metadados no Supabase: ${snapshotError.message}`)
    }

    const dealsSynced = currentLeads.length + (backfill?.dealsSynced ?? 0)
    const mode: BitrixSyncMode = backfill
      ? 'incremental+backfill'
      : bootstrap
        ? 'bootstrap'
        : 'incremental'
    const details = {
      ...state.details,
      mode,
      dealsSynced,
      dealsRemovedOutsideScope: currentExcluded.length,
      metadataSynced: true,
      ...(storedBackfill ? { backfill: storedBackfill } : {}),
    }
    await finishSync(owner, { success: true, coverageStart, details })

    return {
      ok: true,
      skipped: false,
      mode,
      dealsSynced,
      coverageStart,
      completedAt: nowIso,
      ...(backfill ? { backfill } : {}),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido na sincronização'
    await finishSync(owner, { success: false, error: message }).catch(() => undefined)
    throw error
  }
}
