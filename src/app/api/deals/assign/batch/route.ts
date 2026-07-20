import { NextResponse } from 'next/server'
import { updateDealAssigneesBatch } from '@/api/bitrix'
import { getDealsBitrixWebhookCandidates } from '@/lib/server/bitrixWebhook'
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

  const auth = await requireUserPermission('leads_transferir')
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const body = (await request.json()) as { dealIds?: string[]; assignedById?: string }

    if (!body.assignedById || !body.dealIds?.length) {
      return NextResponse.json(
        { error: 'dealIds e assignedById são obrigatórios' },
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

    const uniqueDealIds = [...new Set(body.dealIds.map(String))]
    const result = await updateDealAssigneesBatch(
      webhookUrl,
      uniqueDealIds,
      body.assignedById
    )

    if (result.succeeded.length === 0) {
      return NextResponse.json(
        {
          error: result.failed[0]?.error ?? 'Nenhuma negociação foi transferida',
          ...result,
        },
        { status: 500 }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao transferir negociações'
    return NextResponse.json({ error: message }, { status: bitrixRouteErrorStatus(message) })
  }
}
