import type { UserProfile, UserPermission } from '@/types/access'

export function isAdminProfile(profile: Pick<UserProfile, 'role' | 'visao'> | null | undefined): boolean {
  if (!profile) return false
  return profile.role === 'admin' || profile.visao === 'admin'
}

export function hasPermission(
  profile: Pick<UserProfile, 'role' | 'visao' | 'permissions'> | null | undefined,
  permission: UserPermission
): boolean {
  if (!profile) return false
  if (isAdminProfile(profile)) return true
  return profile.permissions?.includes(permission) ?? false
}

export function formatPermissionsSummary(
  profile: Pick<UserProfile, 'role' | 'visao' | 'permissions'>,
  labels: Record<UserPermission, string>
): string {
  if (isAdminProfile(profile)) return 'Todos os poderes'
  if (!profile.permissions?.length) return 'Somente visualização'
  return profile.permissions.map((item) => labels[item]).join(' · ')
}
