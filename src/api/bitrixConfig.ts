export const ESTEIRA_GERAL_ID = process.env.NEXT_PUBLIC_BITRIX_ESTEIRA_GERAL_ID ?? '16'
export const ESTEIRA_ECONOMICO_ID =
  process.env.NEXT_PUBLIC_BITRIX_ESTEIRA_ECONOMICO_ID ?? '64'

export const ESTEIRA_GERAL_NAME = 'Comercial Geral'
export const ESTEIRA_ECONOMICO_NAME = 'Comercial Econômico'

export function getCategoryIdsForEsteira(esteira: string): string[] {
  switch (esteira) {
    case 'GERAL':
      return [ESTEIRA_GERAL_ID]
    case 'ECONOMICO':
      return [ESTEIRA_ECONOMICO_ID]
    default:
      return [ESTEIRA_GERAL_ID, ESTEIRA_ECONOMICO_ID]
  }
}

export function isEconomicoCategory(categoryId: string): boolean {
  return String(categoryId) === String(ESTEIRA_ECONOMICO_ID)
}

export function isGeralCategory(categoryId: string): boolean {
  return String(categoryId) === String(ESTEIRA_GERAL_ID)
}
