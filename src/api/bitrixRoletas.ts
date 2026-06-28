export const ROLETA_ENTITY_TYPE_ID = 129
export const ROLETA_DEAL_FIELD = 'UF_CRM_1734703374'

export interface StuppRoleta {
  id: string
  title: string
  isActive: boolean
}

interface BitrixRoletaItem {
  id: number | string
  title: string
  stageId?: string
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function bitrixPost<T>(
  webhookUrl: string,
  method: string,
  body: Record<string, unknown>,
  retries = 3
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(`${webhookUrl}${method}.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    if (data.error || res.status === 429) {
      const msg = String(data.error_description ?? data.error ?? res.statusText)
      if ((msg.includes('operation time limit') || res.status === 429) && attempt < retries) {
        await sleep((attempt + 1) * 4000)
        continue
      }
      throw new Error(`Bitrix API error: ${msg}`)
    }

    return data
  }

  throw new Error('Bitrix API error: limite de requisições excedido')
}

export function isStuppRoletaTitle(title: string): boolean {
  return /stüpp|stupp|hub stüpp/i.test(title)
}

export function isInactiveRoletaTitle(title: string): boolean {
  const normalized = title.trim()

  if (
    /^\[(?:inativ[ao]?|descartad[ao]?|exclu[ií]d[ao]?|teste)/i.test(normalized)
  ) {
    return true
  }

  return /\binativ[ao]?|desativad|descartad|exclu[ií]d|suspens[ao]?|\bteste\b/i.test(
    normalized
  )
}

export async function fetchStuppRoletas(webhookUrl: string): Promise<StuppRoleta[]> {
  const all: BitrixRoletaItem[] = []
  let start = 0

  while (true) {
    const data = await bitrixPost<{
      result?: { items?: BitrixRoletaItem[] }
      next?: number
    }>(webhookUrl, 'crm.item.list', {
      entityTypeId: ROLETA_ENTITY_TYPE_ID,
      select: ['id', 'title', 'stageId'],
      order: { title: 'ASC' },
      start,
    })

    all.push(...(data.result?.items ?? []))

    if (data.next === undefined) break
    start = data.next
    await sleep(100)
  }

  return all
    .filter(
      (item) => isStuppRoletaTitle(item.title) && !isInactiveRoletaTitle(item.title)
    )
    .map((item) => ({
      id: String(item.id),
      title: item.title.trim(),
      isActive: true,
    }))
    .sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'))
}

export function resolveRoletaTitle(
  roletas: StuppRoleta[],
  roletaId: string
): string | undefined {
  if (!roletaId) return undefined
  return roletas.find((roleta) => roleta.id === roletaId)?.title
}
