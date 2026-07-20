import { assertBitrixNotPaused } from '@/lib/server/bitrixPaused'

export const BITRIX_REQUEST_TIMEOUT_MS = 45_000
export const BITRIX_MAX_RETRIES = 0
const READ_DEDUP_TTL_MS = 10_000

let nextWebhookStartIndex = 0
const inFlightReads = new Map<string, Promise<unknown>>()
const recentReads = new Map<string, { expiresAt: number; value: unknown }>()

function isRateLimitMessage(message: string, status: number): boolean {
  return (
    status === 429 ||
    message.includes('operation time limit') ||
    message.includes('Too Many Requests') ||
    message.includes('QUERY_LIMIT_EXCEEDED')
  )
}

function markRateLimited(error: Error): Error {
  ;(error as Error & { rateLimited?: boolean }).rateLimited = true
  return error
}

function isReadMethod(method: string): boolean {
  return (
    method.endsWith('.get') ||
    method.endsWith('.list') ||
    method.endsWith('.items')
  )
}

function buildReadKey(method: string, body: Record<string, unknown>): string {
  return `${method}:${JSON.stringify(body)}`
}

function pruneReadCache(now: number): void {
  if (recentReads.size < 500) return

  for (const [key, entry] of recentReads) {
    if (entry.expiresAt <= now) recentReads.delete(key)
  }

  if (recentReads.size >= 500) {
    const oldestKey = recentReads.keys().next().value
    if (oldestKey) recentReads.delete(oldestKey)
  }
}

async function bitrixPostOnce<T>(
  webhookUrl: string,
  method: string,
  body: Record<string, unknown>,
  retries = BITRIX_MAX_RETRIES
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), BITRIX_REQUEST_TIMEOUT_MS)

    try {
      const res = await fetch(`${webhookUrl}${method}.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
        cache: 'no-store',
      })

      const data = await res.json()

      if (data.error || res.status === 429) {
        const msg = String(data.error_description ?? data.error ?? res.statusText)
        const rateLimited = isRateLimitMessage(msg, res.status)

        if (rateLimited && attempt < retries) {
          continue
        }

        const error = new Error(`Bitrix API error: ${msg}`)
        if (rateLimited) markRateLimited(error)
        throw error
      }

      return data
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        if (attempt < retries) {
          continue
        }
        throw markRateLimited(
          new Error('Bitrix API error: tempo limite da requisicao excedido')
        )
      }
      throw error
    } finally {
      clearTimeout(timeout)
    }
  }

  throw markRateLimited(new Error('Bitrix API error: limite de requisicoes excedido'))
}

function rotateWebhookCandidates(candidates: string[]): string[] {
  if (candidates.length <= 1) return candidates

  const start = nextWebhookStartIndex % candidates.length
  nextWebhookStartIndex += 1

  return [...candidates.slice(start), ...candidates.slice(0, start)]
}

export async function bitrixPost<T>(
  webhookUrlOrCandidates: string | string[],
  method: string,
  body: Record<string, unknown>,
  retries = BITRIX_MAX_RETRIES
): Promise<T> {
  assertBitrixNotPaused()

  const candidates = Array.isArray(webhookUrlOrCandidates)
    ? webhookUrlOrCandidates
    : [webhookUrlOrCandidates]

  if (candidates.length === 0) {
    throw new Error('Nenhum webhook Bitrix configurado')
  }

  const webhookUrl = rotateWebhookCandidates(candidates)[0]
  const execute = () =>
    bitrixPostOnce<T>(webhookUrl, method, body, Math.min(retries, BITRIX_MAX_RETRIES))

  if (!isReadMethod(method)) {
    return execute()
  }

  const now = Date.now()
  pruneReadCache(now)
  const key = buildReadKey(method, body)
  const cached = recentReads.get(key)
  if (cached && cached.expiresAt > now) {
    return cached.value as T
  }
  if (cached) recentReads.delete(key)

  const pending = inFlightReads.get(key)
  if (pending) return pending as Promise<T>

  const request = execute()
    .then((value) => {
      recentReads.set(key, {
        expiresAt: Date.now() + READ_DEDUP_TTL_MS,
        value,
      })
      return value
    })
    .finally(() => {
      inFlightReads.delete(key)
    })

  inFlightReads.set(key, request)
  return request
}
