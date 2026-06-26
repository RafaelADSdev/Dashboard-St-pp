import { unstable_cache } from 'next/cache'
import { fetchStageLabels } from '@/api/bitrix'
import { fetchStuppOrgStructure } from '@/api/bitrixDepartments'
import { ESTEIRA_ECONOMICO_ID, ESTEIRA_GERAL_ID } from '@/api/bitrixConfig'
import { getServerBitrixWebhookUrl } from './bitrixWebhook'

export const getCachedOrgStructure = unstable_cache(
  async () => fetchStuppOrgStructure(getServerBitrixWebhookUrl()),
  ['stupp-org-structure'],
  { revalidate: 60 * 60 * 24 }
)

export const getCachedStageLabels = unstable_cache(
  async () => {
    const webhookUrl = getServerBitrixWebhookUrl()
    const [geral, economico] = await Promise.all([
      fetchStageLabels(webhookUrl, ESTEIRA_GERAL_ID),
      fetchStageLabels(webhookUrl, ESTEIRA_ECONOMICO_ID),
    ])
    return { ...geral, ...economico }
  },
  ['stupp-stage-labels'],
  { revalidate: 60 * 60 * 24 }
)
