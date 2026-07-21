import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import {
  addCorretorToRoleta,
  removeCorretorFromRoleta,
} from '@/api/bitrixRoletaMutations'
import {
  invalidateDistributedRoletaMembership,
} from '@/lib/server/cachedBitrix'
import { getSyncedBitrixMetadata } from '@/lib/server/supabaseBitrixData'
import { refreshSyncedRoletaMembership } from '@/lib/server/syncBitrixToSupabase'
import { requireUserPermission } from '@/lib/supabase/access'
import { getMetaBitrixWebhookCandidates } from '@/lib/server/bitrixWebhook'
import {
  BITRIX_PAUSED_MESSAGE,
  bitrixRouteErrorStatus,
  isBitrixPaused,
} from '@/lib/server/bitrixPaused'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (isBitrixPaused()) {
    return NextResponse.json(
      { error: BITRIX_PAUSED_MESSAGE },
      { status: bitrixRouteErrorStatus(BITRIX_PAUSED_MESSAGE) }
    )
  }

  const auth = await requireUserPermission('roleta_corretores')
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const { id: roletaId } = await context.params
    const body = (await request.json()) as {
      roletaTitle?: string
      corretorUserId?: string
      corretorName?: string
    }

    if (!body.roletaTitle?.trim() || !body.corretorUserId || !body.corretorName?.trim()) {
      return NextResponse.json(
        { error: 'roletaTitle, corretorUserId e corretorName são obrigatórios' },
        { status: 400 }
      )
    }

    const webhookUrl = getMetaBitrixWebhookCandidates()
    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'Configure BITRIX_WEBHOOK_URL no .env' },
        { status: 500 }
      )
    }

    const { org } = await getSyncedBitrixMetadata()
    if (!org.allUserIds.includes(body.corretorUserId)) {
      return NextResponse.json(
        { error: 'Corretor fora da superintendência Stüpp' },
        { status: 400 }
      )
    }

    const recordId = await addCorretorToRoleta(webhookUrl, org, {
      roletaTitle: body.roletaTitle.trim(),
      corretorUserId: body.corretorUserId,
      corretorName: body.corretorName.trim(),
    })

    await invalidateDistributedRoletaMembership()
    await refreshSyncedRoletaMembership()
    revalidateTag('stupp-roleta-corretores', 'max')

    return NextResponse.json({ ok: true, recordId, roletaId })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Erro ao adicionar corretor na roleta'
    return NextResponse.json({ error: message }, { status: bitrixRouteErrorStatus(message) })
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (isBitrixPaused()) {
    return NextResponse.json(
      { error: BITRIX_PAUSED_MESSAGE },
      { status: bitrixRouteErrorStatus(BITRIX_PAUSED_MESSAGE) }
    )
  }

  const auth = await requireUserPermission('roleta_corretores')
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    await context.params
    const body = (await request.json()) as { recordId?: string }

    if (!body.recordId) {
      return NextResponse.json({ error: 'recordId é obrigatório' }, { status: 400 })
    }

    const webhookUrl = getMetaBitrixWebhookCandidates()
    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'Configure BITRIX_WEBHOOK_URL no .env' },
        { status: 500 }
      )
    }

    await removeCorretorFromRoleta(webhookUrl, body.recordId)
    await invalidateDistributedRoletaMembership()
    await refreshSyncedRoletaMembership()
    revalidateTag('stupp-roleta-corretores', 'max')

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Erro ao remover corretor da roleta'
    return NextResponse.json({ error: message }, { status: bitrixRouteErrorStatus(message) })
  }
}
