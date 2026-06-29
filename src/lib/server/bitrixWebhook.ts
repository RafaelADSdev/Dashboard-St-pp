export function getServerBitrixWebhookUrl(): string {
  const url = process.env.BITRIX_WEBHOOK_URL ?? process.env.VITE_BITRIX_WEBHOOK_URL ?? ''
  if (!url) {
    throw new Error('Configure BITRIX_WEBHOOK_URL no ambiente')
  }
  return url.endsWith('/') ? url : `${url}/`
}
