import type { RoletaCorretorMember } from '@/api/types'

export function groupCorretoresByLideranca(
  corretores: RoletaCorretorMember[]
): [string, RoletaCorretorMember[]][] {
  const map = new Map<string, RoletaCorretorMember[]>()

  for (const corretor of corretores) {
    const key = corretor.liderancaName ?? corretor.equipe ?? 'Sem liderança'
    const list = map.get(key) ?? []
    list.push(corretor)
    map.set(key, list)
  }

  for (const members of map.values()) {
    members.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  }

  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'))
}
