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

export const BITRIX_DEAL_EXTRA_SELECT = [
  'MODIFY_BY_ID',
  'MOVED_TIME',
  GERAL_NOVOS_LEADS_DATE_FIELD,
  GERAL_ENTRADA_DATE_FIELD,
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

export function isGeralCategoryId(categoryId: string): boolean {
  return String(categoryId) === String(ESTEIRA_GERAL_ID)
}

export function resolveDealArrivedAt(raw: RawDeal, categoryId: string): string {
  if (isGeralCategoryId(categoryId)) {
    return (
      pickLatest(
        String(raw[GERAL_NOVOS_LEADS_DATE_FIELD] ?? ''),
        String(raw[GERAL_ENTRADA_DATE_FIELD] ?? ''),
        String(raw.DATE_CREATE ?? '')
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
