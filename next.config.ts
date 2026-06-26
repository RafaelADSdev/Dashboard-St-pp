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
  },
  turbopack: {
    root: process.cwd(),
  },
}

export default nextConfig
