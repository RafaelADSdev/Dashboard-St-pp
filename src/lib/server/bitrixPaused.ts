export const BITRIX_PAUSED_MESSAGE =
  'Integração com Bitrix pausada temporariamente para reduzir carga no webhook.'

export function isBitrixPaused(): boolean {
  return process.env.BITRIX_PAUSED === 'true' || process.env.BITRIX_PAUSED === '1'
}

export function assertBitrixNotPaused(): void {
  if (isBitrixPaused()) {
    throw new Error(BITRIX_PAUSED_MESSAGE)
  }
}

export function bitrixRouteErrorStatus(message: string): number {
  if (message === BITRIX_PAUSED_MESSAGE) return 503
  if (message.includes('operation time limit')) return 503
  return 500
}
