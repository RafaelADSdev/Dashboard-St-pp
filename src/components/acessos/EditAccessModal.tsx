'use client'

import { useEffect, useState } from 'react'
import { Loader2, Pencil, X } from 'lucide-react'
import clsx from 'clsx'
import { useStuppStructurePreview } from '@/hooks/useStuppOrg'
import {
  allowsMultipleDiretorias,
  getVisaoScopeMode,
  requiresDiretoria,
  requiresEquipe,
} from '@/lib/accessScope'
import type { UpdateAccessPayload, UserEsteira, UserPermission, UserProfile, UserViewSection, UserVisao } from '@/types/access'
import { ALL_VIEW_SECTIONS, ESTEIRA_OPTIONS, PERMISSION_OPTIONS, VISAO_OPTIONS } from '@/types/access'
import { ViewSectionsField } from '@/components/acessos/ViewSectionsField'

const fieldLabelClass =
  'mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500'

const fieldInputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/15 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100'

function ChoiceButton({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'rounded-xl border px-4 py-2.5 text-sm font-medium transition',
        active
          ? 'border-violet-300 bg-violet-50 text-violet-800 shadow-sm dark:border-violet-500/40 dark:bg-violet-500/10 dark:text-violet-200'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
      )}
    >
      {children}
    </button>
  )
}

function DiretoriaCheckbox({
  checked,
  label,
  onChange,
}: {
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
}) {
  return (
    <label
      className={clsx(
        'flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition',
        checked
          ? 'border-violet-300 bg-violet-50 text-violet-800 dark:border-violet-500/40 dark:bg-violet-500/10 dark:text-violet-200'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
      />
      <span>{label}</span>
    </label>
  )
}

interface Props {
  profile: UserProfile
  onClose: () => void
  onSaved: () => Promise<void>
}

export function EditAccessModal({ profile, onClose, onSaved }: Props) {
  const { data: orgData, isLoading: orgLoading } = useStuppStructurePreview()

  const [password, setPassword] = useState('')
  const [visao, setVisao] = useState<UserVisao>(profile.visao ?? 'lider')
  const [esteira, setEsteira] = useState<UserEsteira>(profile.esteira ?? 'GERAL')
  const [diretoriaId, setDiretoriaId] = useState(profile.diretoria_ids?.[0] ?? '')
  const [diretoriaIds, setDiretoriaIds] = useState<string[]>(profile.diretoria_ids ?? [])
  const [equipeId, setEquipeId] = useState(profile.equipe_id ?? '')
  const [permissions, setPermissions] = useState<UserPermission[]>(profile.permissions ?? [])
  const [viewSections, setViewSections] = useState<UserViewSection[]>(
    profile.view_sections?.length ? profile.view_sections : ALL_VIEW_SECTIONS
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const diretorias = orgData?.diretorias ?? []
  const scopeMode = getVisaoScopeMode(visao)
  const selectedDiretoria = diretorias.find((item) => item.id === diretoriaId)
  const equipes = selectedDiretoria?.teams ?? []

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  useEffect(() => {
    if (visao === 'admin') {
      setPermissions([])
      setViewSections(ALL_VIEW_SECTIONS)
      setEquipeId('')
      setDiretoriaId('')
      setDiretoriaIds([])
      return
    }

    if (requiresEquipe(visao)) {
      setDiretoriaIds([])
      if (!diretoriaId && profile.diretoria_ids?.[0]) {
        setDiretoriaId(profile.diretoria_ids[0])
      }
      return
    }

    if (visao === 'diretor') {
      setEquipeId('')
      setDiretoriaIds([])
      if (!diretoriaId && profile.diretoria_ids?.[0]) {
        setDiretoriaId(profile.diretoria_ids[0])
      }
      return
    }

    setDiretoriaId('')
    setEquipeId('')
  }, [visao])

  function togglePermission(permission: UserPermission, checked: boolean) {
    setPermissions((current) =>
      checked ? [...new Set([...current, permission])] : current.filter((item) => item !== permission)
    )
  }

  function selectDiretoria(id: string) {
    setDiretoriaId((current) => (current === id ? '' : id))
    setEquipeId('')
  }

  function toggleDiretoria(id: string, checked: boolean) {
    setDiretoriaIds((current) =>
      checked ? [...new Set([...current, id])] : current.filter((item) => item !== id)
    )
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    if (visao !== 'admin' && viewSections.length === 0) {
      setError('Selecione ao menos uma área visível para o usuário.')
      setSubmitting(false)
      return
    }

    const payload: UpdateAccessPayload = {
      id: profile.id,
      visao,
      esteira,
      diretoriaIds: allowsMultipleDiretorias(visao)
        ? diretoriaIds
        : diretoriaId
          ? [diretoriaId]
          : [],
      equipeId: requiresEquipe(visao) ? equipeId : null,
      permissions: visao === 'admin' ? [] : permissions,
      viewSections: visao === 'admin' ? [] : viewSections,
      ...(password.trim() ? { password: password.trim() } : {}),
    }

    try {
      const res = await fetch('/api/admin/access', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const body = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        throw new Error(body.error ?? 'Não foi possível atualizar o acesso.')
      }

      await onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível atualizar o acesso.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-access-title"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
              Editar acesso
            </p>
            <h2 id="edit-access-title" className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">
              {profile.username}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Atualize visão, esteira, escopo e poderes. Deixe a senha em branco para mantê-la.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error ? (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="edit-access-password" className={fieldLabelClass}>
              Nova senha (opcional)
            </label>
            <input
              id="edit-access-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Deixe em branco para não alterar"
              minLength={6}
              className={fieldInputClass}
              disabled={submitting}
            />
          </div>

          <div>
            <label htmlFor="edit-access-visao" className={fieldLabelClass}>
              Visão
            </label>
            <select
              id="edit-access-visao"
              value={visao}
              onChange={(e) => setVisao(e.target.value as UserVisao)}
              className={fieldInputClass}
              disabled={submitting}
            >
              {VISAO_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-slate-500">
              {scopeMode === 'all' && 'Admin vê todas as diretorias.'}
              {scopeMode === 'diretoria' && 'Diretor vê uma diretoria inteira.'}
              {scopeMode === 'equipe' && 'Líder e usuário veem apenas uma equipe da diretoria.'}
            </p>
          </div>

          <div>
            <p className={fieldLabelClass}>Esteira do dashboard</p>
            <div className="flex flex-wrap gap-3">
              {ESTEIRA_OPTIONS.map((option) => (
                <ChoiceButton
                  key={option.value}
                  active={esteira === option.value}
                  onClick={() => setEsteira(option.value)}
                >
                  {option.label}
                </ChoiceButton>
              ))}
            </div>
          </div>

          {requiresDiretoria(visao) ? (
            <div>
              <p className={fieldLabelClass}>
                {allowsMultipleDiretorias(visao) ? 'Diretorias' : 'Diretoria'}
              </p>
              {orgLoading ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando diretorias...
                </div>
              ) : diretorias.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhuma diretoria encontrada no Bitrix.</p>
              ) : allowsMultipleDiretorias(visao) ? (
                <div className="flex flex-wrap gap-3">
                  {diretorias.map((diretoria) => (
                    <DiretoriaCheckbox
                      key={diretoria.id}
                      label={diretoria.name}
                      checked={diretoriaIds.includes(diretoria.id)}
                      onChange={(checked) => toggleDiretoria(diretoria.id, checked)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {diretorias.map((diretoria) => (
                    <ChoiceButton
                      key={diretoria.id}
                      active={diretoriaId === diretoria.id}
                      onClick={() => selectDiretoria(diretoria.id)}
                    >
                      {diretoria.name}
                    </ChoiceButton>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {requiresEquipe(visao) ? (
            <div>
              <label htmlFor="edit-access-equipe" className={fieldLabelClass}>
                Equipe
              </label>
              <select
                id="edit-access-equipe"
                value={equipeId}
                onChange={(e) => setEquipeId(e.target.value)}
                className={fieldInputClass}
                disabled={submitting || !diretoriaId}
                required
              >
                <option value="">
                  {diretoriaId ? 'Selecione a equipe' : 'Selecione uma diretoria primeiro'}
                </option>
                {equipes.map((equipe) => (
                  <option key={equipe.id} value={equipe.id}>
                    {equipe.label ?? equipe.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <ViewSectionsField
            value={viewSections}
            onChange={setViewSections}
            disabled={submitting}
            isAdmin={visao === 'admin'}
          />

          <div>
            <p className={fieldLabelClass}>Poderes do usuário</p>
            {visao === 'admin' ? (
              <p className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-800 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-200">
                Administradores têm todos os poderes automaticamente.
              </p>
            ) : (
              <div className="space-y-4">
                {(['Roletas', 'Esteiras'] as const).map((group) => (
                  <div key={group}>
                    <p className="mb-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {group}
                    </p>
                    <div className="grid gap-3 md:grid-cols-2">
                      {PERMISSION_OPTIONS.filter((item) => item.group === group).map((option) => (
                        <label
                          key={option.value}
                          className={clsx(
                            'flex cursor-pointer gap-3 rounded-xl border px-4 py-3 transition',
                            permissions.includes(option.value)
                              ? 'border-violet-300 bg-violet-50 dark:border-violet-500/40 dark:bg-violet-500/10'
                              : 'border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-800'
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={permissions.includes(option.value)}
                            onChange={(e) => togglePermission(option.value, e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                          />
                          <span>
                            <span className="block text-sm font-medium text-slate-800 dark:text-slate-100">
                              {option.label}
                            </span>
                            <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                              {option.description}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Pencil className="h-4 w-4" />
              )}
              Salvar alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
