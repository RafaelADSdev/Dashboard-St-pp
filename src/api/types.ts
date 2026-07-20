export interface BitrixLead {
  id: string
  title: string
  assigned_by_id: string
  assigned_by_name: string
  equipe: string
  diretoria: string
  stage_id: string
  category_id: string
  date_create: string
  date_modify: string
  date_arrived: string
  date_last_movement: string
  modified_by_id: string
  modified_by_name: string
  source_id: string
  roleta: string
}

export interface StuppTeamOption {
  id: string
  label: string
  diretoria: string
  leaderName?: string
}

export interface DiretoriaSummary {
  id: string
  name: string
  leads: number
}

export interface TeamDetail {
  id: string
  label: string
  diretoria: string
  leaderName?: string
  leads: number
  byStage: { stage: string; count: number }[]
  overTime: { date: string; economico: number; geral: number }[]
}

export interface KanbanCard {
  id: string
  title: string
  assignedById: string
  assignedByName: string
  diretoria: string
  roleta: string
  source: string
  equipe: string
  dateCreate: string
  dateModify: string
  modifiedByName: string
  categoryId: string
}

export interface KanbanStage {
  id: string
  name: string
  color: string
  sort: number
  categoryId: string
  semantics: string | null
  cards: KanbanCard[]
}

export interface KanbanBoard {
  categoryId: string
  title: string
  stages: KanbanStage[]
}

export interface ExportLeadDetail {
  id: string
  title: string
  esteira: string
  stage: string
  corretor: string
  diretoria: string
  equipe: string
  roleta: string
  origem: string
  dateCreateIso: string
  dateModifyIso: string
  dateCreate: string
  daysInPipeline: number
  tempoNaEsteira: string
  dateModify: string
  daysWithoutUpdate: number
  tempoSemAtualizar: string
}

export interface LeadsDashboardData {
  totalLeads: number
  leadsPerdidos: number
  corretoresAtivosRoleta: number
  economicoCount: number
  geralCount: number
  byTeam: { equipe: string; leads: number }[]
  byDiretoria: DiretoriaSummary[]
  teamDetails: TeamDetail[]
  byStage: { stage: string; count: number }[]
  bySource: { source: string; count: number }[]
  kanbanBoards: KanbanBoard[]
  funnelEconomico: { x: string; y: number }[]
  funnelGeral: { x: string; y: number }[]
  overTime: { date: string; economico: number; geral: number }[]
  leadDetails: ExportLeadDetail[]
  diretorias: string[]
  equipes: StuppTeamOption[]
}

export type RoletaOperationalStatus = 'ativa' | 'nova' | 'suspensa'

export interface StuppRoletaOption {
  id: string
  title: string
  isActive: boolean
  status?: RoletaOperationalStatus
  liderancaId?: string
  liderancaName?: string
  createdAt?: string
  corretores?: RoletaCorretorMember[]
  diretoriaIds?: string[]
  liderancaIds?: string[]
  equipeIds?: string[]
}

export interface FilterParams {
  dateFrom: string
  dateTo: string
  diretoria: string
  equipe: string
  corretor: string
  roleta: string
  esteira: string
}

export interface RoletaStat {
  id: string
  title: string
  status: RoletaOperationalStatus
  liderancaId: string
  liderancaName: string
  createdAt?: string
  totalLeads: number
  geralLeads: number
  economicoLeads: number
  corretores?: RoletaCorretorMember[]
  diretoriaIds?: string[]
  liderancaIds?: string[]
  equipeIds?: string[]
  corretorLeadCounts?: Record<
    string,
    { totalLeads: number; geralLeads: number; economicoLeads: number }
  >
}

export interface RoletaCorretorMember {
  recordId: string
  nome: string
  corretorUserId?: string
  diretorUserId?: string
  cargoId?: string
  cargoLabel?: string
  diretoriaId?: string
  diretoriaName?: string
  equipeId?: string
  liderancaId?: string
  liderancaName?: string
  equipe?: string
  totalLeads?: number
  geralLeads?: number
  economicoLeads?: number
}

export interface RoletaMembershipSummary {
  corretores: RoletaCorretorMember[]
  diretoriaIds: string[]
  liderancaIds: string[]
  equipeIds: string[]
}

export interface RoletasDashboardData {
  totalLeads: number
  activeRoletas: number
  novasRoletas: number
  suspensasRoletas: number
  roletas: RoletaStat[]
  liderancas: { id: string; name: string }[]
}
