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
  source_id: string
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

export interface LeadsDashboardData {
  totalLeads: number
  economicoCount: number
  geralCount: number
  byTeam: { equipe: string; leads: number }[]
  byDiretoria: DiretoriaSummary[]
  teamDetails: TeamDetail[]
  byStage: { stage: string; count: number }[]
  funnelEconomico: { x: string; y: number }[]
  funnelGeral: { x: string; y: number }[]
  overTime: { date: string; economico: number; geral: number }[]
  diretorias: string[]
  equipes: StuppTeamOption[]
}

export interface FilterParams {
  dateFrom: string
  dateTo: string
  diretoria: string
  equipe: string
  esteira: string
}
