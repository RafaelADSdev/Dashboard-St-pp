import { NextResponse } from 'next/server'
import { updateDealStage } from '@/api/bitrix'
import { getDealsBitrixWebhookCandidates } from '@/lib/server/bitrixWebhook'
import { patchSyncedDeal } from '@/lib/server/supabaseBitrixData'
import { requireUserPermission } from '@/lib/supabase/access'
import { bitrixRouteErrorStatus, isBitrixPaused, BITRIX_PAUSED_MESSAGE } from '@/lib/server/bitrixPaused'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  if (isBitrixPaused()) {
    return NextResponse.json(
      { error: BITRIX_PAUSED_MESSAGE },
      { status: bitrixRouteErrorStatus(BITRIX_PAUSED_MESSAGE) }
    )
  }

  const auth = await requireUserPermission('esteira_movimentar')
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const body = (await request.json()) as { dealId?: string; stageId?: string }

    if (!body.dealId || !body.stageId) {
      return NextResponse.json({ error: 'dealId e stageId são obrigatórios' }, { status: 400 })
    }

    const webhookUrl = getDealsBitrixWebhookCandidates()
    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'Configure BITRIX_WEBHOOK_URL no .env' },
        { status: 500 }
      )
    }

    await updateDealStage(webhookUrl, body.dealId, body.stageId)
    await patchSyncedDeal(body.dealId, { stage_id: body.stageId })
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar fase'
    return NextResponse.json({ error: message }, { status: bitrixRouteErrorStatus(message) })
  }
}
