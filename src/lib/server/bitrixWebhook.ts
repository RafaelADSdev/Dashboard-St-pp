export type BitrixWebhookScope = 'default' | 'deals' | 'meta'

function normalizeWebhookUrl(url: string): string {
  return url.endsWith('/') ? url : `${url}/`
}

function readWebhookEnv(...keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key]?.trim()
    if (value) return value
  }
  return ''
}

function uniqueWebhookUrls(urls: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const raw of urls) {
    if (!raw) continue
    const normalized = normalizeWebhookUrl(raw)
    if (seen.has(normalized)) continue
    seen.add(normalized)
    result.push(normalized)
  }

  return result
}

/** Webhook principal (fallback). */
export function getDefaultBitrixWebhookUrl(): string {
  const candidates = getDefaultBitrixWebhookCandidates()
  if (candidates.length === 0) {
    throw new Error('Configure BITRIX_WEBHOOK_URL no ambiente')
  }
  return candidates[0]
}

export function getDefaultBitrixWebhookCandidates(): string[] {
  return uniqueWebhookUrls([readWebhookEnv('BITRIX_WEBHOOK_URL', 'VITE_BITRIX_WEBHOOK_URL')])
}

/** Negociações (listagem, contagem, updates). */
export function getDealsBitrixWebhookUrl(): string {
  const candidates = getDealsBitrixWebhookCandidates()
  if (candidates.length === 0) {
    throw new Error('Configure BITRIX_WEBHOOK_URL ou BITRIX_WEBHOOK_URL_DEALS')
  }
  return candidates[0]
}

export function getDealsBitrixWebhookCandidates(): string[] {
  return uniqueWebhookUrls([
    readWebhookEnv('BITRIX_WEBHOOK_URL_DEALS'),
    readWebhookEnv('BITRIX_WEBHOOK_URL_DEALS_ALT'),
    readWebhookEnv('BITRIX_WEBHOOK_URL'),
    readWebhookEnv('BITRIX_WEBHOOK_URL_META'),
    readWebhookEnv('VITE_BITRIX_WEBHOOK_URL'),
  ])
}

/** Metadados (org, roletas, fases, fontes, usuários). */
export function getMetaBitrixWebhookUrl(): string {
  const candidates = getMetaBitrixWebhookCandidates()
  if (candidates.length === 0) {
    throw new Error('Configure BITRIX_WEBHOOK_URL ou BITRIX_WEBHOOK_URL_META')
  }
  return candidates[0]
}

export function getMetaBitrixWebhookCandidates(): string[] {
  return uniqueWebhookUrls([
    readWebhookEnv('BITRIX_WEBHOOK_URL_META'),
    readWebhookEnv('BITRIX_WEBHOOK_URL'),
    readWebhookEnv('BITRIX_WEBHOOK_URL_DEALS'),
    readWebhookEnv('VITE_BITRIX_WEBHOOK_URL'),
  ])
}

export function hasSplitBitrixWebhooks(): boolean {
  const deals = readWebhookEnv('BITRIX_WEBHOOK_URL_DEALS')
  const meta = readWebhookEnv('BITRIX_WEBHOOK_URL_META')
  return Boolean(deals && meta && deals !== meta)
}

/** @deprecated Use getDealsBitrixWebhookUrl ou getMetaBitrixWebhookUrl */
export function getServerBitrixWebhookUrl(scope: BitrixWebhookScope = 'default'): string {
  if (scope === 'deals') return getDealsBitrixWebhookUrl()
  if (scope === 'meta') return getMetaBitrixWebhookUrl()
  return getDefaultBitrixWebhookUrl()
}
