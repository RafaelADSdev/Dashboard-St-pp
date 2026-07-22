import type { BitrixWebhookRef } from '@/api/bitrix'
import { bitrixPost } from '@/api/bitrixRequest'

/** Lista Bitrix "Corretores da Roleta" — fonte do Status de Ativo (Sim/Não). */
export const ROLETA_CORRETOR_LIST_IBLOCK_ID = 28
export const ROLETA_CORRETOR_LIST_STATUS_FIELD = 'PROPERTY_110'
export const ROLETA_CORRETOR_LIST_STATUS_SIM = '154'
export const ROLETA_CORRETOR_LIST_STATUS_NAO = '156'
export const ROLETA_CORRETOR_LIST_USER_ID_FIELD = 'PROPERTY_100'
export const ROLETA_CORRETOR_LIST_ROLETA_NAME_FIELD = 'PROPERTY_102'
export const ROLETA_CORRETOR_LIST_CORRETOR_FIELD = 'PROPERTY_106'
/** Vínculo com a roleta (entity 129) — só entradas com link contam no Hub. */
export const ROLETA_CORRETOR_LIST_LINK_FIELD = 'PROPERTY_104'

const PAGE_SIZE = 50

export interface BitrixRoletaCorretorListItem {
  ID: string
  NAME?: string
  PROPERTY_100?: Record<string, string> | string
  PROPERTY_102?: Record<string, string> | string
  PROPERTY_104?: Record<string, string> | string
  PROPERTY_106?: Record<string, string> | string
  PROPERTY_110?: Record<string, string> | string
}

export interface LinkedRoletaCorretorEntry {
  listElementId: string
  roletaId: string
  roletaTitle: string
  corretorUserId: string
  nome: string
  ativoNaRoleta: boolean
}

/** @deprecated Use LinkedRoletaCorretorEntry via buildLinkedRoletaCorretorEntries */
export type RoletaCorretorAtivoIndex = Map<string, boolean>

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function normalizeTitle(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

export function extractListPropertyValue(value: unknown): string | undefined {
  if (value == null || value === '') return undefined
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (typeof value === 'object') {
    const values = Object.values(value as Record<string, string | number>)
    const first = values[0]
    return first == null ? undefined : String(first)
  }
  return undefined
}

export function extractListPropertyValues(value: unknown): string[] {
  if (value == null || value === '') return []
  if (typeof value === 'string' || typeof value === 'number') return [String(value)]
  if (typeof value === 'object') {
    return Object.values(value as Record<string, string | number>)
      .map((item) => (item == null ? '' : String(item)))
      .filter(Boolean)
  }
  return []
}

export function parseCorretorUserIdFromList(value: unknown): string | undefined {
  const raw = extractListPropertyValue(value)
  if (!raw) return undefined

  const match = raw.match(/^user_(\d+)$/i)
  if (match) return match[1]

  if (/^\d+$/.test(raw)) return raw

  return undefined
}

export function parseAtivoNaRoletaFromList(value: unknown): boolean | undefined {
  const status = extractListPropertyValue(value)
  if (!status) return undefined
  if (status === ROLETA_CORRETOR_LIST_STATUS_SIM) return true
  if (status === ROLETA_CORRETOR_LIST_STATUS_NAO) return false
  return undefined
}

function normalizeRoletaLinkId(value: string): string {
  const trimmed = value.trim()
  const dynamicMatch = trimmed.match(/(\d+)\s*$/)
  return dynamicMatch ? dynamicMatch[1] : trimmed
}

export function buildLinkedRoletaCorretorEntries(
  listItems: BitrixRoletaCorretorListItem[],
  roletas: { id: string; title: string }[]
): LinkedRoletaCorretorEntry[] {
  const roletaTitlesById = new Map(
    roletas.map((roleta) => [String(roleta.id), normalizeTitle(roleta.title)])
  )
  const knownRoletaIds = new Set(roletas.map((roleta) => String(roleta.id)))
  const latestByKey = new Map<string, LinkedRoletaCorretorEntry & { sortId: number }>()

  for (const item of listItems) {
    const linkIds = extractListPropertyValues(item[ROLETA_CORRETOR_LIST_LINK_FIELD])
      .map(normalizeRoletaLinkId)
      .filter((linkId) => knownRoletaIds.has(linkId))

    if (linkIds.length === 0) continue

    const roletaTitle = normalizeTitle(
      extractListPropertyValue(item[ROLETA_CORRETOR_LIST_ROLETA_NAME_FIELD]) ?? ''
    )
    const corretorUserId =
      parseCorretorUserIdFromList(item[ROLETA_CORRETOR_LIST_USER_ID_FIELD]) ??
      parseCorretorUserIdFromList(item[ROLETA_CORRETOR_LIST_CORRETOR_FIELD])
    const ativoNaRoleta = parseAtivoNaRoletaFromList(item[ROLETA_CORRETOR_LIST_STATUS_FIELD])

    if (!corretorUserId || ativoNaRoleta === undefined) continue

    const listElementId = String(item.ID)
    const sortId = Number(item.ID)
    if (!sortId) continue

    const nome = normalizeTitle(item.NAME ?? '') || 'Sem nome'

    for (const roletaId of linkIds) {
      const key = `${roletaId}::${corretorUserId}`
      const existing = latestByKey.get(key)

      if (!existing || sortId > existing.sortId) {
        latestByKey.set(key, {
          sortId,
          listElementId,
          roletaId,
          roletaTitle: roletaTitlesById.get(roletaId) ?? roletaTitle,
          corretorUserId,
          nome,
          ativoNaRoleta,
        })
      }
    }
  }

  return [...latestByKey.values()].map(({ sortId: _sortId, ...entry }) => entry)
}

/** Mantido para compatibilidade com índice legado baseado só em título. */
export function buildRoletaCorretorAtivoIndex(
  items: BitrixRoletaCorretorListItem[]
): RoletaCorretorAtivoIndex {
  const latestByKey = new Map<string, { id: number; ativo: boolean }>()

  for (const item of items) {
    const roletaTitle = normalizeTitle(
      extractListPropertyValue(item[ROLETA_CORRETOR_LIST_ROLETA_NAME_FIELD]) ?? ''
    )
    const corretorUserId =
      parseCorretorUserIdFromList(item[ROLETA_CORRETOR_LIST_USER_ID_FIELD]) ??
      parseCorretorUserIdFromList(item[ROLETA_CORRETOR_LIST_CORRETOR_FIELD])

    if (!roletaTitle || !corretorUserId) continue

    const ativo = parseAtivoNaRoletaFromList(item[ROLETA_CORRETOR_LIST_STATUS_FIELD])
    if (ativo === undefined) continue

    const key = `${roletaTitle}::${corretorUserId}`
    const id = Number(item.ID)
    if (!id) continue

    const existing = latestByKey.get(key)
    if (!existing || id > existing.id) {
      latestByKey.set(key, { id, ativo })
    }
  }

  const index: RoletaCorretorAtivoIndex = new Map()
  for (const [key, entry] of latestByKey) {
    index.set(key, entry.ativo)
  }

  return index
}

export function resolveAtivoNaRoletaFromIndex(
  roletaTitle: string,
  corretorUserId: string | undefined,
  ativoIndex?: RoletaCorretorAtivoIndex
): boolean | undefined {
  if (!corretorUserId || !ativoIndex) return undefined

  return ativoIndex.get(`${normalizeTitle(roletaTitle)}::${corretorUserId}`)
}

async function fetchRoletaCorretorListItemsForTitle(
  webhookUrl: BitrixWebhookRef,
  roletaTitle: string
): Promise<BitrixRoletaCorretorListItem[]> {
  const all: BitrixRoletaCorretorListItem[] = []
  let start = 0

  while (true) {
    const data = await bitrixPost<{
      result?: BitrixRoletaCorretorListItem[]
      total?: number
    }>(webhookUrl, 'lists.element.get', {
      IBLOCK_TYPE_ID: 'lists',
      IBLOCK_ID: ROLETA_CORRETOR_LIST_IBLOCK_ID,
      FILTER: {
        [ROLETA_CORRETOR_LIST_ROLETA_NAME_FIELD]: roletaTitle,
      },
      SELECT: [
        'ID',
        'NAME',
        ROLETA_CORRETOR_LIST_USER_ID_FIELD,
        ROLETA_CORRETOR_LIST_ROLETA_NAME_FIELD,
        ROLETA_CORRETOR_LIST_LINK_FIELD,
        ROLETA_CORRETOR_LIST_CORRETOR_FIELD,
        ROLETA_CORRETOR_LIST_STATUS_FIELD,
      ],
      start,
    })

    const batch = data.result ?? []
    all.push(...batch)

    if (batch.length < PAGE_SIZE) break
    start += batch.length
    await sleep(50)
  }

  return all
}

export async function fetchRoletaCorretorListItems(
  webhookUrl: BitrixWebhookRef,
  roletaTitles: string[]
): Promise<BitrixRoletaCorretorListItem[]> {
  const exactTitles = [...new Set(roletaTitles.map(normalizeTitle).filter(Boolean))]
  const all: BitrixRoletaCorretorListItem[] = []

  for (const roletaTitle of exactTitles) {
    const items = await fetchRoletaCorretorListItemsForTitle(webhookUrl, roletaTitle)
    all.push(...items)
    await sleep(50)
  }

  return all
}
