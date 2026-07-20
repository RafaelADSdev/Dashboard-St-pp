import type { UserProfile, UserViewSection } from '@/types/access'
import { ALL_VIEW_SECTIONS } from '@/types/access'
import { isAdminProfile } from '@/lib/userPermissions'

export function resolveViewSections(
  profile: Pick<UserProfile, 'role' | 'visao' | 'view_sections'> | null | undefined
): UserViewSection[] {
  if (!profile) return []
  if (isAdminProfile(profile)) return ALL_VIEW_SECTIONS
  if (!profile.view_sections?.length) return ALL_VIEW_SECTIONS
  return profile.view_sections
}

export function canViewSection(
  profile: Pick<UserProfile, 'role' | 'visao' | 'view_sections'> | null | undefined,
  section: UserViewSection
): boolean {
  return resolveViewSections(profile).includes(section)
}

export function pathnameToViewSection(pathname: string): UserViewSection | null {
  if (pathname.startsWith('/esteira-economico')) return 'esteira_economico'
  if (pathname.startsWith('/esteira-geral')) return 'esteira_geral'
  if (pathname.startsWith('/roletas')) return 'roletas'
  if (pathname === '/') return 'visao_geral'
  return null
}

export function getDefaultLandingPath(
  profile: Pick<UserProfile, 'role' | 'visao' | 'view_sections'> | null | undefined
): string {
  const sections = resolveViewSections(profile)
  const first = VIEW_SECTION_PATHS.find((item) => sections.includes(item.section))
  return first?.path ?? '/'
}

const VIEW_SECTION_PATHS: { section: UserViewSection; path: string }[] = [
  { section: 'visao_geral', path: '/' },
  { section: 'esteira_economico', path: '/esteira-economico' },
  { section: 'esteira_geral', path: '/esteira-geral' },
  { section: 'roletas', path: '/roletas' },
]

export function formatViewSectionsSummary(
  profile: Pick<UserProfile, 'role' | 'visao' | 'view_sections'>,
  labels: Record<UserViewSection, string>
): string {
  if (isAdminProfile(profile)) return 'Todas as áreas'
  const sections = resolveViewSections(profile)
  if (sections.length === ALL_VIEW_SECTIONS.length) return 'Todas as áreas'
  return sections.map((item) => labels[item]).join(' · ')
}
