import { unstable_cache } from 'next/cache'
import { fetchSourceLabels, fetchStageDefinitions } from '@/api/bitrix'
import { fetchStuppRoletasCatalog } from '@/api/bitrixRoletas'
import {
  attachMembershipToRoletaIds,
  buildRoletaMembershipIndex,
  fetchRoletaCorretorItems,
} from '@/api/bitrixRoletaCorretores'
import { fetchStuppOrgStructure } from '@/api/bitrixDepartments'
import { ESTEIRA_ECONOMICO_ID, ESTEIRA_GERAL_ID } from '@/api/bitrixConfig'
import type { StageCatalog } from '@/api/bitrixStages'
import { buildStageLabels } from '@/api/bitrixStages'
import { getMetaBitrixWebhookCandidates } from './bitrixWebhook'
import {
  deleteDistributedCache,
  withDistributedCache,
} from './distributedCache'

const metaWebhooks = () => getMetaBitrixWebhookCandidates()
const CACHE_DAY_SECONDS = 60 * 60 * 24

export const BITRIX_DISTRIBUTED_CACHE_KEYS = {
  org: 'bitrix:org:v1',
  roletasCatalog: 'bitrix:roletas:catalog:v10',
  roletaMembership: 'bitrix:roletas:membership:v3',
  stages: 'bitrix:stages:v1',
  sources: 'bitrix:sources:v1',
} as const

export const getCachedOrgStructure = unstable_cache(
  async () =>
    withDistributedCache(
      BITRIX_DISTRIBUTED_CACHE_KEYS.org,
      CACHE_DAY_SECONDS,
      () => fetchStuppOrgStructure(metaWebhooks())
    ),
  ['stupp-org-structure'],
  { revalidate: CACHE_DAY_SECONDS }
)

export const getCachedStuppRoletasCatalog = unstable_cache(
  async () =>
    withDistributedCache(
      BITRIX_DISTRIBUTED_CACHE_KEYS.roletasCatalog,
      CACHE_DAY_SECONDS,
      async () => {
        const org = await getCachedOrgStructure()
        return fetchStuppRoletasCatalog(metaWebhooks(), org)
      }
    ),
  ['stupp-roletas-catalog-v9'],
  { revalidate: CACHE_DAY_SECONDS, tags: ['stupp-roletas-catalog'] }
)

export const getCachedRoletaCorretoresMembership = unstable_cache(
  async () =>
    withDistributedCache(
      BITRIX_DISTRIBUTED_CACHE_KEYS.roletaMembership,
      CACHE_DAY_SECONDS,
      async () => {
        const org = await getCachedOrgStructure()
        const roletas = await getCachedStuppRoletasCatalog()
        const corretorItems = await fetchRoletaCorretorItems(
          metaWebhooks(),
          roletas.map((roleta) => roleta.title)
        )

        const index = buildRoletaMembershipIndex(corretorItems, org)
        const membershipByRoletaId = attachMembershipToRoletaIds(
          index,
          roletas.map((roleta) => ({ id: roleta.id, title: roleta.title }))
        )

        return {
          membershipByRoletaId,
          diretorias: org.diretorias.map((diretoria) => ({
            id: diretoria.id,
            name: diretoria.name,
            leaderName: diretoria.leaderName,
          })),
        }
      }
    ),
  ['stupp-roleta-corretores-v2'],
  { revalidate: CACHE_DAY_SECONDS, tags: ['stupp-roleta-corretores'] }
)

export async function getCachedStuppRoletas() {
  const catalog = await getCachedStuppRoletasCatalog()
  return catalog.filter((roleta) => roleta.isActive)
}

export const getCachedStageCatalog = unstable_cache(
  async (): Promise<StageCatalog> =>
    withDistributedCache(
      BITRIX_DISTRIBUTED_CACHE_KEYS.stages,
      CACHE_DAY_SECONDS,
      async () => {
        const webhookUrl = metaWebhooks()
        const geral = await fetchStageDefinitions(webhookUrl, ESTEIRA_GERAL_ID)
        const economico = await fetchStageDefinitions(webhookUrl, ESTEIRA_ECONOMICO_ID)

        return {
          geral,
          economico,
          labels: {
            ...buildStageLabels(geral),
            ...buildStageLabels(economico),
          },
        }
      }
    ),
  ['stupp-stage-catalog'],
  { revalidate: CACHE_DAY_SECONDS }
)

export const getCachedSourceLabels = unstable_cache(
  async () =>
    withDistributedCache(
      BITRIX_DISTRIBUTED_CACHE_KEYS.sources,
      CACHE_DAY_SECONDS,
      () => fetchSourceLabels(metaWebhooks())
    ),
  ['stupp-source-labels'],
  { revalidate: CACHE_DAY_SECONDS }
)

export async function invalidateDistributedRoletasCatalog(): Promise<void> {
  await deleteDistributedCache([
    BITRIX_DISTRIBUTED_CACHE_KEYS.roletasCatalog,
  ])
}

export async function invalidateDistributedRoletaMembership(): Promise<void> {
  await deleteDistributedCache([
    BITRIX_DISTRIBUTED_CACHE_KEYS.roletaMembership,
  ])
}

/** @deprecated Use getCachedStageCatalog */
export async function getCachedStageLabels() {
  const catalog = await getCachedStageCatalog()
  return catalog.labels
}
