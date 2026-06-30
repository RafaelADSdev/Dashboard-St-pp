import { assertBitrixNotPaused } from '@/lib/server/bitrixPaused'

export const BITRIX_REQUEST_TIMEOUT_MS = 45_000
export const BITRIX_MAX_RETRIES = 1

let nextWebhookStartIndex = 0

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRateLimitMessage(message: string, status: number): boolean {
  return (
    status === 429 ||
    message.includes('operation time limit') ||
    message.includes('Too Many Requests') ||
    message.includes('QUERY_LIMIT_EXCEEDED')
  )
}

function isRateLimitedError(error: Error): boolean {
  return Boolean((error as Error & { rateLimited?: boolean }).rateLimited)
}

function markRateLimited(error: Error): Error {
  ;(error as Error & { rateLimited?: boolean }).rateLimited = true
  return error
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
          await sleep((attempt + 1) * 2000)
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
          await sleep((attempt + 1) * 2000)
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

  const orderedCandidates = rotateWebhookCandidates(candidates)
  const retriesPerWebhook = orderedCandidates.length > 1 ? 0 : retries
  let lastError: Error | null = null

  for (const webhookUrl of orderedCandidates) {
    try {
      return await bitrixPostOnce<T>(webhookUrl, method, body, retriesPerWebhook)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      lastError = err

      if (!isRateLimitedError(err) || webhookUrl === orderedCandidates.at(-1)) {
        throw err
      }

      await sleep(250)
    }
  }

  throw lastError ?? new Error('Bitrix API error: limite de requisicoes excedido')
}
