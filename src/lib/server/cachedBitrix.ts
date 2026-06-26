import { unstable_cache } from 'next/cache'
import { fetchStageDefinitions } from '@/api/bitrix'
import { fetchStuppOrgStructure } from '@/api/bitrixDepartments'
import { ESTEIRA_ECONOMICO_ID, ESTEIRA_GERAL_ID } from '@/api/bitrixConfig'
import type { StageCatalog } from '@/api/bitrixStages'
import { buildStageLabels } from '@/api/bitrixStages'
import { getServerBitrixWebhookUrl } from './bitrixWebhook'

export const getCachedOrgStructure = unstable_cache(
  async () => fetchStuppOrgStructure(getServerBitrixWebhookUrl()),
  ['stupp-org-structure'],
  { revalidate: 60 * 60 * 24 }
)

export const getCachedStageCatalog = unstable_cache(
  async (): Promise<StageCatalog> => {
    const webhookUrl = getServerBitrixWebhookUrl()
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

/** @deprecated Use getCachedStageCatalog */
export async function getCachedStageLabels() {
  const catalog = await getCachedStageCatalog()
  return catalog.labels
}
