import { useMemo } from 'react'
import { useCurrentProfile } from '@/hooks/useCurrentProfile'
import { hasPermission } from '@/lib/userPermissions'
import type { UserPermission } from '@/types/access'

export function useUserPermissions() {
  const { data: profile } = useCurrentProfile()

  return useMemo(
    () => ({
      profile,
      canManageRoletaStatus: hasPermission(profile, 'roleta_status'),
      canManageRoletaCorretores: hasPermission(profile, 'roleta_corretores'),
      canMoveEsteira: hasPermission(profile, 'esteira_movimentar'),
      canTransferLeads: hasPermission(profile, 'leads_transferir'),
      has: (permission: UserPermission) => hasPermission(profile, permission),
    }),
    [profile]
  )
}
