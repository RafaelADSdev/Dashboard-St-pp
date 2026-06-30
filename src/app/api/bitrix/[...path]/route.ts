import { NextResponse, type NextRequest } from 'next/server'
import {
  BITRIX_PAUSED_MESSAGE,
  bitrixRouteErrorStatus,
  isBitrixPaused,
} from '@/lib/server/bitrixPaused'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{ path: string[] }>
}

function getWebhookUrl() {
  return process.env.BITRIX_WEBHOOK_URL ?? process.env.VITE_BITRIX_WEBHOOK_URL ?? ''
}

function buildTargetUrl(webhookUrl: string, path: string[], search: string) {
  const normalizedWebhook = webhookUrl.endsWith('/') ? webhookUrl : `${webhookUrl}/`
  const target = new URL(path.join('/'), normalizedWebhook)
  target.search = search
  return target
}

async function proxyBitrix(request: NextRequest, context: RouteContext) {
  if (isBitrixPaused()) {
    return NextResponse.json(
      { error: BITRIX_PAUSED_MESSAGE },
      { status: bitrixRouteErrorStatus(BITRIX_PAUSED_MESSAGE) }
    )
  }

  const webhookUrl = getWebhookUrl()

  if (!webhookUrl) {
    return NextResponse.json(
      { error: 'Configure BITRIX_WEBHOOK_URL no .env' },
      { status: 500 }
    )
  }

  const { path } = await context.params
  const target = buildTargetUrl(webhookUrl, path, request.nextUrl.search)
  const headers = new Headers(request.headers)
  headers.delete('host')
  headers.delete('content-length')
  headers.delete('connection')

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: 'no-store',
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.text()
  }

  const response = await fetch(target, init)
  const contentType = response.headers.get('content-type') ?? 'application/json'
  const body = await response.text()

  return new NextResponse(body, {
    status: response.status,
    headers: {
      'content-type': contentType,
    },
  })
}

export function GET(request: NextRequest, context: RouteContext) {
  return proxyBitrix(request, context)
}

export function POST(request: NextRequest, context: RouteContext) {
  return proxyBitrix(request, context)
}
