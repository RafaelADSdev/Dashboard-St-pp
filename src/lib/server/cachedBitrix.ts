import { unstable_cache } from 'next/cache'
import { fetchSourceLabels, fetchStageDefinitions } from '@/api/bitrix'
import { fetchStuppRoletas, fetchStuppRoletasCatalog } from '@/api/bitrixRoletas'
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

const metaWebhooks = () => getMetaBitrixWebhookCandidates()

export const getCachedOrgStructure = unstable_cache(
  async () => fetchStuppOrgStructure(metaWebhooks()),
  ['stupp-org-structure'],
  { revalidate: 60 * 60 * 24 }
)

export const getCachedStuppRoletasCatalog = unstable_cache(
  async () => {
    const org = await getCachedOrgStructure()
    return fetchStuppRoletasCatalog(metaWebhooks(), org)
  },
  ['stupp-roletas-catalog-v9'],
  { revalidate: 60 * 60 * 24, tags: ['stupp-roletas-catalog'] }
)

export const getCachedRoletaCorretoresMembership = unstable_cache(
  async () => {
    const org = await getCachedOrgStructure()
    const [corretorItems, roletas] = await Promise.all([
      fetchRoletaCorretorItems(metaWebhooks()),
      fetchStuppRoletasCatalog(metaWebhooks(), org),
    ])

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
  },
  ['stupp-roleta-corretores-v2'],
  { revalidate: 60 * 60 * 24, tags: ['stupp-roleta-corretores'] }
)

export const getCachedStuppRoletas = unstable_cache(
  async () => {
    const org = await getCachedOrgStructure()
    return fetchStuppRoletas(metaWebhooks(), org)
  },
  ['stupp-roletas-v9'],
  { revalidate: 60 * 60 * 24 }
)

export const getCachedStageCatalog = unstable_cache(
  async (): Promise<StageCatalog> => {
    const webhookUrl = metaWebhooks()
    const [geral, economico] = await Promise.all([
      fetchStageDefinitions(webhookUrl, ESTEIRA_GERAL_ID),
      fetchStageDefinitions(webhookUrl, ESTEIRA_ECONOMICO_ID),
    ])

    return {
      geral,
      economico,
      labels: {
        ...buildStageLabels(geral),
        ...buildStageLabels(economico),
      },
    }
  },
  ['stupp-stage-catalog'],
  { revalidate: 60 * 60 * 24 }
)

export const getCachedSourceLabels = unstable_cache(
  async () => fetchSourceLabels(metaWebhooks()),
  ['stupp-source-labels'],
  { revalidate: 60 * 60 * 24 }
)

/** @deprecated Use getCachedStageCatalog */
export async function getCachedStageLabels() {
  const catalog = await getCachedStageCatalog()
  return catalog.labels
}
