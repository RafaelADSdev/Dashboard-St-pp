import { NextResponse } from 'next/server'
import { updateDealStage } from '@/api/bitrix'
import { getServerBitrixWebhookUrl } from '@/lib/server/bitrixWebhook'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { dealId?: string; stageId?: string }

    if (!body.dealId || !body.stageId) {
      return NextResponse.json({ error: 'dealId e stageId são obrigatórios' }, { status: 400 })
    }

    const webhookUrl = getServerBitrixWebhookUrl()
    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'Configure BITRIX_WEBHOOK_URL no .env' },
        { status: 500 }
      )
    }

    await updateDealStage(webhookUrl, body.dealId, body.stageId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar fase'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
