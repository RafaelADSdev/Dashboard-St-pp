import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import {
  getSupabasePublishableKey,
  getSupabaseUrl,
  isSupabaseAuthEnabled,
  shouldEnforceAuth,
} from './config'

const PUBLIC_PATHS = new Set([
  '/login',
  '/auth/callback',
  '/auth/logout',
  '/api/cron/sync-bitrix',
])

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.has(pathname)
}

function isStaticAsset(pathname: string): boolean {
  return /\.(?:svg|png|jpe?g|gif|webp|ico|woff2?)$/i.test(pathname)
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL('/login', request.url)
  const { pathname } = request.nextUrl
  if (pathname !== '/') {
    loginUrl.searchParams.set('from', pathname)
  }
  return NextResponse.redirect(loginUrl)
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isStaticAsset(pathname)) {
    return NextResponse.next({ request })
  }

  const enforceAuth = shouldEnforceAuth()

  if (!enforceAuth) {
    return NextResponse.next({ request })
  }

  if (!isSupabaseAuthEnabled()) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Supabase Auth não configurado no servidor.' },
        { status: 503 }
      )
    }
    if (!isPublicPath(pathname)) {
      return redirectToLogin(request)
    }
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

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const isAuthenticated = Boolean(user)

  if (isPublicPath(pathname)) {
    if (isAuthenticated && pathname === '/login') {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return supabaseResponse
  }

  if (isAuthenticated) {
    return supabaseResponse
  }

  return redirectToLogin(request)
}
