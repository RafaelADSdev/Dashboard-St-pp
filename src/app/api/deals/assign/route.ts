import { NextResponse } from 'next/server'
import { updateDealAssignee } from '@/api/bitrix'
import { getDealsBitrixWebhookCandidates } from '@/lib/server/bitrixWebhook'
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

  try {
    const body = (await request.json()) as { dealId?: string; assignedById?: string }

    if (!body.dealId || !body.assignedById) {
      return NextResponse.json(
        { error: 'dealId e assignedById são obrigatórios' },
        { status: 400 }
      )
    }

    const webhookUrl = getDealsBitrixWebhookCandidates()
    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'Configure BITRIX_WEBHOOK_URL no .env' },
        { status: 500 }
      )
    }

    await updateDealAssignee(webhookUrl, body.dealId, body.assignedById)
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao transferir negociação'
    return NextResponse.json({ error: message }, { status: bitrixRouteErrorStatus(message) })
  }
}
