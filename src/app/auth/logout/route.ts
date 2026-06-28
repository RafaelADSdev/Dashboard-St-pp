import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabasePublishableKey, getSupabaseUrl, isSupabaseAuthEnabled } from '@/lib/supabase/config'

export const runtime = 'nodejs'

async function signOutAndRedirect(request: NextRequest) {
  const loginUrl = new URL('/login', request.url)

  if (!isSupabaseAuthEnabled()) {
    return NextResponse.redirect(loginUrl)
  }

  let response = NextResponse.redirect(loginUrl)

  const supabase = createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  await supabase.auth.signOut()
  return response
}

export async function GET(request: NextRequest) {
  return signOutAndRedirect(request)
}

export async function POST(request: NextRequest) {
  return signOutAndRedirect(request)
}
