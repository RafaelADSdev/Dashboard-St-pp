'use client'

import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Loader2, User } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import clsx from 'clsx'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseAuthEnabled, shouldEnforceAuth } from '@/lib/supabase/config'
import { usernameToEmail } from '@/lib/supabase/username'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const authError = searchParams?.get('error') === 'auth'
  const displayError = error || (authError ? 'Não foi possível autenticar. Tente novamente.' : '')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')

    if (!shouldEnforceAuth() && !isSupabaseAuthEnabled()) {
      setError('Supabase Auth não configurado. Defina as variáveis de ambiente.')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const email = usernameToEmail(username)

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError('Usuário ou senha incorretos.')
        return
      }

      const from = searchParams.get('from') || '/'
      router.replace(from)
      router.refresh()
    } catch {
      setError('Usuário ou senha incorretos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-sidebar font-sans">
      {/* Fundo imersivo — lado direito */}
      <div className="login-bg-glow pointer-events-none fixed inset-0 z-0" aria-hidden />
      <div
        className="pointer-events-none fixed inset-0 z-[1] bg-linear-to-br from-[#080f1a]/75 via-[#0c1222]/55 to-[#1e3a5f]/45"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 z-[1] opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
        aria-hidden
      />

      {/* Marca visual no fundo (desktop) */}
      <div
        className="pointer-events-none fixed right-[8%] top-1/2 z-[2] hidden -translate-y-1/2 lg:block"
        aria-hidden
      >
        <p className="max-w-xs text-right text-[11px] font-semibold uppercase tracking-[0.35em] text-white">
          Superintendência Stüpp
        </p>
        <p className="mt-3 max-w-sm text-right text-4xl font-bold leading-tight tracking-tight text-white">
          Dashboard
          <br />
          Comercial
        </p>
      </div>

      {/* Divisor vertical */}
      <div
        className="pointer-events-none fixed bottom-0 left-[38%] top-0 z-[2] hidden w-px bg-white/9 sm:block"
        aria-hidden
      />

      {/* Painel de login */}
      <div
        className={clsx(
          'fixed inset-y-0 left-0 z-[3] flex w-full flex-col justify-center',
          'border-r border-white/8 bg-[#080f1a]/62 px-7 py-10 shadow-[20px_0_60px_rgba(0,0,0,0.25)] backdrop-blur-2xl backdrop-saturate-150',
          'sm:min-w-[340px] sm:max-w-[38%] sm:px-[52px] sm:py-14'
        )}
      >
        {/* Logo */}
        <div className="login-enter login-enter-delay-1 mb-10 sm:mb-11">
          <div className="flex items-center gap-5">
            <Image
              src="/stupp-logo.png"
              alt="Superintendência Stüpp"
              width={180}
              height={52}
              priority
              className="h-11 w-auto brightness-0 invert sm:h-12"
            />
            <div className="h-10 w-px bg-white/15" />
            <Image
              src="/hubon-logo-white.png"
              alt="HubON"
              width={110}
              height={36}
              className="h-8 w-auto brightness-0 invert opacity-90 sm:h-9"
            />
          </div>
          <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-400">
            Dashboard Comercial
          </p>
        </div>

        <h1 className="login-enter login-enter-delay-2 mb-2 text-[28px] font-bold leading-tight tracking-tight text-white">
          Bem-vindo
          <br />
          de volta
        </h1>
        <p className="login-enter login-enter-delay-3 mb-9 text-[13px] leading-relaxed text-white/50">
          Acesse com suas credenciais para continuar.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {displayError ? (
            <p
              className="rounded-lg border border-red-400/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-300"
              style={{ animation: 'loginFadeIn 0.3s ease' }}
              role="alert"
            >
              {displayError}
            </p>
          ) : null}

          <div className="login-enter login-enter-delay-4">
            <label
              htmlFor="username"
              className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-white/42"
            >
              Usuário
            </label>
            <div className="relative">
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-[9px] border border-white/14 bg-white/7 py-3.5 pl-4 pr-11 text-[13px] text-white outline-none transition-[border-color,background,box-shadow] placeholder:text-white/20 focus:border-blue-400/55 focus:bg-blue-500/4 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.09)]"
                placeholder="Digite seu usuário"
                required
                disabled={loading}
              />
              <User className="pointer-events-none absolute right-3.5 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-white/30" />
            </div>
          </div>

          <div className="login-enter login-enter-delay-5">
            <label
              htmlFor="password"
              className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-white/42"
            >
              Senha
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-[9px] border border-white/14 bg-white/7 py-3.5 pl-4 pr-11 text-[13px] text-white outline-none transition-[border-color,background,box-shadow] placeholder:text-white/20 focus:border-blue-400/55 focus:bg-blue-500/4 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.09)]"
                placeholder="Digite sua senha"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center text-white/30 transition-colors hover:text-brand-400"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                tabIndex={-1}
              >
                {showPassword ? (
                  <Eye className="h-[15px] w-[15px]" />
                ) : (
                  <EyeOff className="h-[15px] w-[15px]" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={clsx(
              'login-enter login-enter-delay-6 group relative mt-3 w-full overflow-hidden rounded-xl py-4 text-xs font-bold uppercase tracking-[0.24em] transition-all duration-300',
              loading
                ? 'cursor-wait bg-blue-900/80 text-white'
                : [
                    'border border-white/10 bg-linear-to-r from-blue-600 via-blue-700 to-indigo-800 text-white',
                    'shadow-[0_4px_24px_rgba(37,99,235,0.35),inset_0_1px_0_rgba(255,255,255,0.12)]',
                    'hover:-translate-y-0.5 hover:border-brand-400/30 hover:shadow-[0_10px_32px_rgba(37,99,235,0.45),inset_0_1px_0_rgba(255,255,255,0.18)]',
                    'active:translate-y-0 active:shadow-[0_4px_16px_rgba(37,99,235,0.3)]',
                  ].join(' ')
            )}
          >
            {!loading ? (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"
              />
            ) : null}
            {loading ? (
              <Loader2 className="relative mx-auto h-[18px] w-[18px] animate-spin" />
            ) : (
              <span className="relative">Entrar</span>
            )}
          </button>
        </form>

        <p className="absolute bottom-6 left-7 text-[10px] tracking-wide text-white/18 sm:left-[52px]">
          © {new Date().getFullYear()} HubON — Superintendência Stüpp
        </p>
      </div>
    </div>
  )
}
