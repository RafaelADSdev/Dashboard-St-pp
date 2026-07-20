export type UserVisao = 'admin' | 'diretor' | 'lider' | 'usuario'

export type UserEsteira = 'TODAS' | 'GERAL' | 'ECONOMICO'

export type UserPermission =
  | 'roleta_status'
  | 'roleta_corretores'
  | 'esteira_movimentar'
  | 'leads_transferir'

export interface UserProfile {
  id: string
  username: string
  role: 'admin' | 'user'
  visao: UserVisao
  esteira: UserEsteira
  diretoria_ids: string[]
  equipe_id: string | null
  permissions: UserPermission[]
  created_at: string
}

export interface CreateAccessPayload {
  username: string
  password: string
  visao: UserVisao
  esteira: UserEsteira
  diretoriaIds: string[]
  equipeId?: string | null
  permissions: UserPermission[]
}

export interface UpdateAccessPayload {
  id: string
  visao: UserVisao
  esteira: UserEsteira
  diretoriaIds: string[]
  equipeId?: string | null
  permissions: UserPermission[]
  password?: string
}

export const VISAO_OPTIONS: { value: UserVisao; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'diretor', label: 'Diretor' },
  { value: 'lider', label: 'Líder' },
  { value: 'usuario', label: 'Usuário' },
]

export const ESTEIRA_OPTIONS: { value: UserEsteira; label: string }[] = [
  { value: 'GERAL', label: 'Comercial Geral' },
  { value: 'ECONOMICO', label: 'Econômico' },
  { value: 'TODAS', label: 'Ambas as esteiras' },
]

export const PERMISSION_OPTIONS: {
  value: UserPermission
  label: string
  description: string
  group: 'Roletas' | 'Esteiras'
}[] = [
  {
    value: 'roleta_status',
    label: 'Iniciar / parar / suspender roletas',
    description: 'Altera o status operacional das roletas.',
    group: 'Roletas',
  },
  {
    value: 'roleta_corretores',
    label: 'Adicionar / remover corretores na roleta',
    description: 'Inclui ou retira corretores do catálogo de roletas.',
    group: 'Roletas',
  },
  {
    value: 'esteira_movimentar',
    label: 'Movimentar fases nas esteiras',
    description: 'Arrasta leads entre fases do kanban no Bitrix.',
    group: 'Esteiras',
  },
  {
    value: 'leads_transferir',
    label: 'Transferir leads',
    description: 'Troca o responsável de um ou vários leads.',
    group: 'Esteiras',
  },
]

export const PERMISSION_LABELS = Object.fromEntries(
  PERMISSION_OPTIONS.map((item) => [item.value, item.label])
) as Record<UserPermission, string>

const VALID_PERMISSIONS = new Set<UserPermission>(
  PERMISSION_OPTIONS.map((item) => item.value)
)

export function parsePermissions(value: unknown): UserPermission[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter((item): item is UserPermission => VALID_PERMISSIONS.has(item as UserPermission)))]
}
