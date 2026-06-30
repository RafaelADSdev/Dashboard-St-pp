import { endOfDay, parseISO, startOfDay } from 'date-fns'
import { ESTEIRA_GERAL_ID } from '@/api/bitrixConfig'

export const GERAL_NOVOS_LEADS_DATE_FIELD = 'UF_CRM_1738332137'
export const GERAL_ENTRADA_DATE_FIELD = 'UF_CRM_1758548300'

export const GERAL_STAGE_DATE_FIELDS = [
  'UF_CRM_1738332137',
  'UF_CRM_1746215242',
  'UF_CRM_1738332178',
  'UF_CRM_1738332203',
  'UF_CRM_1738332216',
  'UF_CRM_1738332229',
  'UF_CRM_1738332248',
  'UF_CRM_1738332856',
  'UF_CRM_1738332282',
] as const

export const BITRIX_DEAL_LIST_SELECT = [
  'MODIFY_BY_ID',
  'MOVED_TIME',
  GERAL_NOVOS_LEADS_DATE_FIELD,
  GERAL_ENTRADA_DATE_FIELD,
] as const

export const BITRIX_DEAL_EXTRA_SELECT = [
  ...BITRIX_DEAL_LIST_SELECT,
  ...GERAL_STAGE_DATE_FIELDS,
] as const

type RawDeal = Record<string, unknown>

function pickLatest(...values: (string | null | undefined)[]): string {
  const valid = values
    .map((value) => String(value ?? '').trim())
    .filter(Boolean)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())

  return valid.at(-1) ?? ''
}

function pickEarliest(...values: (string | null | undefined)[]): string {
  const valid = values
    .map((value) => String(value ?? '').trim())
    .filter(Boolean)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())

  return valid[0] ?? ''
}

export function isGeralCategoryId(categoryId: string): boolean {
  return String(categoryId) === String(ESTEIRA_GERAL_ID)
}

export function getDealEntryDateField(categoryId: string): string {
  return isGeralCategoryId(categoryId) ? GERAL_ENTRADA_DATE_FIELD : 'DATE_CREATE'
}

export function toBitrixDateStart(date: string): string {
  return `${date} 00:00:00`
}

export function toBitrixDateEnd(date: string): string {
  return `${date} 23:59:59`
}

function dateRangeFilter(field: string, dateFrom: string, dateTo: string): Record<string, unknown> {
  return {
    [`>=${field}`]: toBitrixDateStart(dateFrom),
    [`<=${field}`]: toBitrixDateEnd(dateTo),
  }
}

export function buildGeralEntryDateOrFilter(
  dateFrom: string,
  dateTo: string
): Record<string, unknown> {
  const start = toBitrixDateStart(dateFrom)
  const end = toBitrixDateEnd(dateTo)

  return {
    LOGIC: 'OR',
    0: {
      [`>=${GERAL_ENTRADA_DATE_FIELD}`]: start,
      [`<=${GERAL_ENTRADA_DATE_FIELD}`]: end,
    },
    1: {
      [`>=${GERAL_NOVOS_LEADS_DATE_FIELD}`]: start,
      [`<=${GERAL_NOVOS_LEADS_DATE_FIELD}`]: end,
    },
    2: {
      '>=DATE_CREATE': start,
      '<=DATE_CREATE': end,
    },
  }
}

export function buildDealDateFilterVariants(
  categoryId: string,
  dateFrom: string,
  dateTo: string
): Record<string, unknown>[] {
  if (isGeralCategoryId(categoryId)) {
    return [
      dateRangeFilter(GERAL_NOVOS_LEADS_DATE_FIELD, dateFrom, dateTo),
      dateRangeFilter('DATE_CREATE', dateFrom, dateTo),
    ]
  }

  return [dateRangeFilter('DATE_CREATE', dateFrom, dateTo)]
}

export function resolveDealArrivedAt(raw: RawDeal, categoryId: string): string {
  if (isGeralCategoryId(categoryId)) {
    return (
      pickEarliest(
        String(raw[GERAL_ENTRADA_DATE_FIELD] ?? ''),
        String(raw[GERAL_NOVOS_LEADS_DATE_FIELD] ?? '')
      ) || String(raw.DATE_CREATE ?? '')
    )
  }

  return String(raw.DATE_CREATE ?? '')
}

export function resolveDealLastMovementAt(raw: RawDeal, categoryId: string): string {
  if (isGeralCategoryId(categoryId)) {
    const stageDates = GERAL_STAGE_DATE_FIELDS.map((field) => String(raw[field] ?? '')).filter(Boolean)
    return (
      pickLatest(...stageDates, String(raw.MOVED_TIME ?? ''), String(raw.DATE_MODIFY ?? '')) ||
      String(raw.DATE_MODIFY ?? raw.DATE_CREATE ?? '')
    )
  }

  return String(raw.DATE_MODIFY ?? raw.MOVED_TIME ?? raw.DATE_CREATE ?? '')
}

function parseBitrixDate(value: string): Date | null {
  const normalized = String(value ?? '').trim()
  if (!normalized) return null

  const isoLike = normalized.includes('T') ? normalized : normalized.replace(' ', 'T')
  const parsed = parseISO(isoLike)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function isDealEntryInRange(
  dateArrived: string,
  dateFrom: string,
  dateTo: string
): boolean {
  const entry = parseBitrixDate(dateArrived)
  if (!entry) return false

  const from = startOfDay(parseISO(dateFrom))
  const to = endOfDay(parseISO(dateTo))
  return entry >= from && entry <= to
}
