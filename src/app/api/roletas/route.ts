import { NextResponse } from 'next/server'
import { getSyncedBitrixMetadata } from '@/lib/server/supabaseBitrixData'
import { collectMembershipLiderancaOptions } from '@/api/bitrixRoletaCorretores'
import {
  filterActiveRoletaCorretores,
  summarizeCorretorScope,
} from '@/utils/filterRoletaCorretores'
import { bitrixRouteErrorStatus } from '@/lib/server/bitrixPaused'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const {
      roletasCatalog: roletas,
      roletaMembership: membershipData,
      org,
    } = await getSyncedBitrixMetadata()

    const activeStuppUserIds = new Set(org.allUserIds)

    const payload = roletas.map((roleta) => {
      const membership = membershipData.membershipByRoletaId[roleta.id]
      const corretores = filterActiveRoletaCorretores(membership?.corretores ?? [], {
        activeStuppUserIds,
      })
      const scope = summarizeCorretorScope(corretores)

      return {
        id: roleta.id,
        title: roleta.title,
        isActive: roleta.isActive,
        status: roleta.status,
        liderancaId: roleta.liderancaId,
        liderancaName: roleta.liderancaName,
        createdAt: roleta.createdAt,
        corretores,
        diretoriaIds: scope.diretoriaIds,
        liderancaIds: scope.liderancaIds,
        equipeIds: scope.equipeIds,
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
          'Cache-Control': 'private, no-store',
        },
      }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao carregar roletas'
    return NextResponse.json({ error: message }, { status: bitrixRouteErrorStatus(message) })
  }
}
