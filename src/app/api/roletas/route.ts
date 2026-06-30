import { NextResponse } from 'next/server'
import {
  getCachedOrgStructure,
  getCachedRoletaCorretoresMembership,
  getCachedStuppRoletasCatalog,
} from '@/lib/server/cachedBitrix'
import { collectMembershipLiderancaOptions } from '@/api/bitrixRoletaCorretores'
import {
  BITRIX_PAUSED_MESSAGE,
  bitrixRouteErrorStatus,
  isBitrixPaused,
} from '@/lib/server/bitrixPaused'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  if (isBitrixPaused()) {
    return NextResponse.json(
      { error: BITRIX_PAUSED_MESSAGE },
      { status: bitrixRouteErrorStatus(BITRIX_PAUSED_MESSAGE) }
    )
  }

  try {
    const [roletas, membershipData, org] = await Promise.all([
      getCachedStuppRoletasCatalog(),
      getCachedRoletaCorretoresMembership(),
      getCachedOrgStructure(),
    ])

    const payload = roletas.map((roleta) => {
      const membership = membershipData.membershipByRoletaId[roleta.id]
      return {
        id: roleta.id,
        title: roleta.title,
        isActive: roleta.isActive,
        status: roleta.status,
        liderancaId: roleta.liderancaId,
        liderancaName: roleta.liderancaName,
        createdAt: roleta.createdAt,
        corretores: membership?.corretores ?? [],
        diretoriaIds: membership?.diretoriaIds ?? [],
        liderancaIds: membership?.liderancaIds ?? [],
        equipeIds: membership?.equipeIds ?? [],
      }
    })

    return NextResponse.json(
      {
        roletas: payload,
        membershipByRoletaId: membershipData.membershipByRoletaId,
        diretorias: membershipData.diretorias,
        liderancas: collectMembershipLiderancaOptions(
          membershipData.membershipByRoletaId,
          org
        ),
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=300, stale-while-revalidate=3600',
        },
      }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao carregar roletas'
    return NextResponse.json({ error: message }, { status: bitrixRouteErrorStatus(message) })
  }
}
