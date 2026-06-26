import type { ReactNode } from 'react'

export function PageShell({ children }: { children: ReactNode }) {
  return <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">{children}</div>
}
