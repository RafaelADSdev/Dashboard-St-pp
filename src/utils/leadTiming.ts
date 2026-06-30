import { differenceInDays, differenceInHours, format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export interface DurationMetrics {
  days: number
  label: string
}

export function parseBitrixDate(value: string): Date | null {
  if (!value) return null
  try {
    return parseISO(value)
  } catch {
    return null
  }
}

export function formatBitrixDateDisplay(value: string): string {
  const date = parseBitrixDate(value)
  if (!date) return '—'
  try {
    return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR })
  } catch {
    return value
  }
}

export function formatBitrixDateOnly(value: string): string {
  const date = parseBitrixDate(value)
  if (!date) return '—'
  try {
    return format(date, 'dd/MM/yyyy', { locale: ptBR })
  } catch {
    return '—'
  }
}

export function formatBitrixTimeOnly(value: string): string {
  const date = parseBitrixDate(value)
  if (!date) return '—'
  try {
    return format(date, 'HH:mm', { locale: ptBR })
  } catch {
    return '—'
  }
}

export function computeDuration(fromIso: string, reference = new Date()): DurationMetrics {
  const from = parseBitrixDate(fromIso)
  if (!from) return { days: 0, label: '—' }

  const totalHours = Math.max(0, differenceInHours(reference, from))
  const days = Math.max(0, differenceInDays(reference, from))
  const hours = totalHours % 24

  if (days === 0 && hours === 0) {
    return { days: 0, label: 'Menos de 1 hora' }
  }

  if (days === 0) {
    return { days: 0, label: hours === 1 ? '1 hora' : `${hours} horas` }
  }

  if (hours === 0 || days >= 30) {
    return { days, label: days === 1 ? '1 dia' : `${days} dias` }
  }

  return {
    days,
    label: `${days} dia${days === 1 ? '' : 's'} e ${hours}h`,
  }
}
