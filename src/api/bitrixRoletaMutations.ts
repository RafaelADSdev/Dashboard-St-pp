import type { StuppOrgStructure } from '@/api/bitrixDepartments'
import type { BitrixWebhookRef } from '@/api/bitrix'
import { bitrixPost } from '@/api/bitrixRequest'
import {
  ROLETA_CORRETOR_DIRETOR_FIELD,
  ROLETA_CORRETOR_NAME_FIELD,
  ROLETA_CORRETOR_ROLETA_NAME_FIELD,
  ROLETA_CORRETOR_USER_FIELD,
  ROLETA_CORRETOR_ENTITY_TYPE_ID,
} from '@/api/bitrixRoletaCorretores'
import {
  ROLETA_ENTITY_TYPE_ID,
  ROLETA_STAGE_PREFIX,
} from '@/api/bitrixRoletas'
import type { RoletaOperationalStatus } from '@/lib/roletaStatus'

const STATUS_TO_STAGE_SUFFIX: Record<RoletaOperationalStatus, string> = {
  nova: 'NEW',
  ativa: 'PREPARATION',
  suspensa: 'CLIENT',
}

export function resolveBitrixStageIdForStatus(status: RoletaOperationalStatus): string {
  return `${ROLETA_STAGE_PREFIX}:${STATUS_TO_STAGE_SUFFIX[status]}`
}

function resolveDiretorUserId(org: StuppOrgStructure, corretorUserId: string): string | undefined {
  const teamId = org.userToTeamId[corretorUserId]
  if (!teamId) return undefined

  for (const diretoria of org.diretorias) {
    const team = diretoria.teams.find((item) => item.id === teamId)
    if (team) {
      return diretoria.leaderId
    }
  }

  return undefined
}

export async function updateRoletaStatus(
  webhookUrl: BitrixWebhookRef,
  roletaId: string,
  status: RoletaOperationalStatus
): Promise<void> {
  const stageId = resolveBitrixStageIdForStatus(status)

  await bitrixPost(webhookUrl, 'crm.item.update', {
    entityTypeId: ROLETA_ENTITY_TYPE_ID,
    id: Number(roletaId),
    fields: { stageId },
  })
}

export async function addCorretorToRoleta(
  webhookUrl: BitrixWebhookRef,
  org: StuppOrgStructure,
  input: {
    roletaTitle: string
    corretorUserId: string
    corretorName: string
  }
): Promise<string> {
  const diretorUserId = resolveDiretorUserId(org, input.corretorUserId)

  const data = await bitrixPost<{
    result?: { item?: { id?: number | string } }
  }>(webhookUrl, 'crm.item.add', {
    entityTypeId: ROLETA_CORRETOR_ENTITY_TYPE_ID,
    fields: {
      title: input.corretorName,
      [ROLETA_CORRETOR_NAME_FIELD]: input.corretorName,
      [ROLETA_CORRETOR_ROLETA_NAME_FIELD]: input.roletaTitle.trim(),
      [ROLETA_CORRETOR_USER_FIELD]: Number(input.corretorUserId),
      ...(diretorUserId ? { [ROLETA_CORRETOR_DIRETOR_FIELD]: Number(diretorUserId) } : {}),
    },
  })

  const id = data.result?.item?.id
  if (id === undefined || id === null) {
    throw new Error('Bitrix não retornou o ID do corretor cadastrado')
  }

  return String(id)
}

export async function removeCorretorFromRoleta(
  webhookUrl: BitrixWebhookRef,
  recordId: string
): Promise<void> {
  await bitrixPost(webhookUrl, 'crm.item.delete', {
    entityTypeId: ROLETA_CORRETOR_ENTITY_TYPE_ID,
    id: Number(recordId),
  })
}
