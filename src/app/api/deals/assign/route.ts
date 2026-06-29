import { NextResponse } from 'next/server'
import { updateDealAssignee } from '@/api/bitrix'
import { getServerBitrixWebhookUrl } from '@/lib/server/bitrixWebhook'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { dealId?: string; assignedById?: string }

    if (!body.dealId || !body.assignedById) {
      return NextResponse.json(
        { error: 'dealId e assignedById são obrigatórios' },
        { status: 400 }
      )
    }

    const webhookUrl = getServerBitrixWebhookUrl()
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
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
