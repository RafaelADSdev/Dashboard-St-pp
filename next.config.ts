import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BITRIX_ESTEIRA_GERAL_ID:
      process.env.NEXT_PUBLIC_BITRIX_ESTEIRA_GERAL_ID ??
      process.env.VITE_BITRIX_ESTEIRA_GERAL_ID ??
      '16',
    NEXT_PUBLIC_BITRIX_ESTEIRA_ECONOMICO_ID:
      process.env.NEXT_PUBLIC_BITRIX_ESTEIRA_ECONOMICO_ID ??
      process.env.VITE_BITRIX_ESTEIRA_ECONOMICO_ID ??
      '64',
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.VITE_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.VITE_SUPABASE_ANON_KEY,
  },
  turbopack: {
    root: process.cwd(),
  },
}

export default nextConfig
