import { NextResponse } from 'next/server'
import { getCurrentUserProfile } from '@/lib/supabase/access'

export async function GET() {
  const profile = await getCurrentUserProfile()

  if (!profile) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  return NextResponse.json({
    ...profile,
    isAdmin: profile.role === 'admin' || profile.visao === 'admin',
  })
}
