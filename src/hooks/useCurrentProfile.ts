import { useQuery } from '@tanstack/react-query'
import type { UserProfile } from '@/types/access'

interface ProfileResponse extends UserProfile {
  isAdmin: boolean
}

async function fetchProfile(): Promise<ProfileResponse> {
  const res = await fetch('/api/auth/profile')
  if (!res.ok) {
    throw new Error('Não autenticado')
  }
  return res.json()
}

export function useCurrentProfile() {
  return useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: fetchProfile,
    staleTime: 1000 * 60 * 5,
    retry: false,
  })
}
