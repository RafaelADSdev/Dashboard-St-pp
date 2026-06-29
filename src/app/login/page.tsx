import { Suspense } from 'react'
import { LoginForm } from '@/components/auth/LoginForm'

function LoginFallback() {
  return (
    <div className="login-bg-glow flex min-h-screen items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  )
}
