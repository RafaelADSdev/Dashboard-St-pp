import { Redis } from '@upstash/redis'
import { createHash, randomUUID } from 'node:crypto'

const DEFAULT_LOCK_SECONDS = 60
const LOCK_WAIT_MS = 10_000
const LOCK_POLL_MS = 250
const CACHE_OPERATION_TIMEOUT_MS = 3_000

let redisClient: Redis | null | undefined

function getRedis(): Redis | null {
  if (redisClient !== undefined) return redisClient

  const url =
    process.env.UPSTASH_REDIS_REST_URL ??
    process.env.KV_REST_API_URL
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ??
    process.env.KV_REST_API_TOKEN

  if (!url || !token) {
    redisClient = null
    return null
  }

  redisClient = new Redis({ url, token })
  return redisClient
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function withTimeout<T>(operation: Promise<T>): Promise<T> {
  return Promise.race([
    operation,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error('Tempo limite do cache distribuído excedido')),
        CACHE_OPERATION_TIMEOUT_MS
      )
    ),
  ])
}

async function releaseLock(redis: Redis, key: string, token: string): Promise<void> {
  await redis.eval(
    "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
    [key],
    [token]
  )
}

export function isDistributedCacheConfigured(): boolean {
  return Boolean(getRedis())
}

export function buildDistributedCacheKey(
  namespace: string,
  payload: unknown
): string {
  const digest = createHash('sha256')
    .update(JSON.stringify(payload))
    .digest('hex')
  return `${namespace}:${digest}`
}

export async function withDistributedCache<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>
): Promise<T> {
  const redis = getRedis()
  if (!redis) return loader()

  let cached: T | null = null
  try {
    cached = await withTimeout(redis.get<T>(key))
  } catch {
    return loader()
  }
  if (cached !== null && cached !== undefined) return cached

  const lockKey = `${key}:lock`
  const lockToken = randomUUID()
  let acquired: unknown
  try {
    acquired = await withTimeout(
      redis.set(lockKey, lockToken, {
        nx: true,
        ex: DEFAULT_LOCK_SECONDS,
      })
    )
  } catch {
    return loader()
  }

  if (!acquired) {
    try {
      const deadline = Date.now() + LOCK_WAIT_MS
      while (Date.now() < deadline) {
        await sleep(LOCK_POLL_MS)
        const filled = await withTimeout(redis.get<T>(key))
        if (filled !== null && filled !== undefined) return filled
      }
    } catch {
      // Fall through to the source when Redis becomes unavailable while waiting.
    }

    return loader()
  }

  try {
    const value = await loader()
    try {
      await withTimeout(redis.set(key, value, { ex: ttlSeconds }))
    } catch {
      // A Redis write failure must not discard valid source data.
    }
    return value
  } finally {
    await withTimeout(releaseLock(redis, lockKey, lockToken)).catch(() => undefined)
  }
}

export async function deleteDistributedCache(keys: string[]): Promise<void> {
  const redis = getRedis()
  if (!redis || keys.length === 0) return

  try {
    await redis.del(...keys)
  } catch {
    // Redis is an optimization; cache invalidation must not break mutations.
  }
}
