import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabasePublishableKey, getSupabaseUrl, isSupabaseAuthEnabled } from './config'

const PUBLIC_PATHS = new Set(['/login', '/auth/callback'])

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.has(pathname)
}

function isStaticAsset(pathname: string): boolean {
  return /\.(?:svg|png|jpe?g|gif|webp|ico|woff2?)$/i.test(pathname)
}

export async function updateSession(request: NextRequest) {
  if (!isSupabaseAuthEnabled() || isStaticAsset(request.nextUrl.pathname)) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options)
        })
      },
    },
  })

  const { data } = await supabase.auth.getClaims()
  const isAuthenticated = Boolean(data?.claims)

  const { pathname } = request.nextUrl

  if (isPublicPath(pathname)) {
    if (isAuthenticated && pathname === '/login') {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return supabaseResponse
  }

  if (isAuthenticated) {
    return supabaseResponse
  }

  const loginUrl = new URL('/login', request.url)
  if (pathname !== '/') {
    loginUrl.searchParams.set('from', pathname)
  }
  return NextResponse.redirect(loginUrl)
}
