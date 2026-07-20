'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Shield,
  Trash2,
  UserPlus,
} from 'lucide-react'
import clsx from 'clsx'
import { useStuppStructurePreview } from '@/hooks/useStuppOrg'
import { useCurrentProfile } from '@/hooks/useCurrentProfile'
import {
  allowsMultipleDiretorias,
  getVisaoScopeMode,
  requiresDiretoria,
  requiresEquipe,
} from '@/lib/accessScope'
import type { CreateAccessPayload, UserEsteira, UserPermission, UserProfile, UserViewSection, UserVisao } from '@/types/access'
import { ALL_VIEW_SECTIONS, ESTEIRA_OPTIONS, PERMISSION_OPTIONS, PERMISSION_LABELS, VIEW_SECTION_LABELS, VISAO_OPTIONS } from '@/types/access'
import { formatPermissionsSummary } from '@/lib/userPermissions'
import { formatViewSectionsSummary } from '@/lib/viewSections'
import { EditAccessModal } from '@/components/acessos/EditAccessModal'
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

export function AccessManagementPage() {
  const router = useRouter()
  const { data: profile, isLoading: profileLoading } = useCurrentProfile()
  const { data: orgData, isLoading: orgLoading } = useStuppStructurePreview()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [visao, setVisao] = useState<UserVisao>('lider')
  const [esteira, setEsteira] = useState<UserEsteira>('GERAL')
  const [diretoriaId, setDiretoriaId] = useState('')
  const [diretoriaIds, setDiretoriaIds] = useState<string[]>([])
  const [equipeId, setEquipeId] = useState('')
  const [permissions, setPermissions] = useState<UserPermission[]>([])
  const [viewSections, setViewSections] = useState<UserViewSection[]>(ALL_VIEW_SECTIONS)
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const diretorias = orgData?.diretorias ?? []
  const scopeMode = getVisaoScopeMode(visao)
  const selectedDiretoria = diretorias.find((item) => item.id === diretoriaId)
  const equipes = selectedDiretoria?.teams ?? []

  useEffect(() => {
    setDiretoriaId('')
    setDiretoriaIds([])
    setEquipeId('')
    if (visao === 'admin') {
      setPermissions([])
      setViewSections(ALL_VIEW_SECTIONS)
    }
  }, [visao])

  function togglePermission(permission: UserPermission, checked: boolean) {
    setPermissions((current) =>
      checked ? [...new Set([...current, permission])] : current.filter((item) => item !== permission)
    )
  }

  useEffect(() => {
    setEquipeId('')
  }, [diretoriaId])

  function getDiretoriaLabel(id: string) {
    return diretorias.find((item) => item.id === id)?.name ?? id
  }

  function getEquipeLabel(id: string | null | undefined) {
    if (!id) return '—'
    for (const diretoria of diretorias) {
      const team = diretoria.teams.find((item) => item.id === id)
      if (team) return team.label ?? team.name
    }
    return id
  }

  function formatProfileScope(item: UserProfile) {
    if (item.visao === 'admin' && !item.diretoria_ids?.length) {
      return 'Todas'
    }

    const diretoriaLabel =
      item.diretoria_ids?.length === 1
        ? getDiretoriaLabel(item.diretoria_ids[0])
        : item.diretoria_ids?.length
          ? `${item.diretoria_ids.length} diretorias`
          : 'Todas'

    if (item.equipe_id) {
      return `${diretoriaLabel} · ${getEquipeLabel(item.equipe_id)}`
    }

    return diretoriaLabel
  }

  useEffect(() => {
    if (!profileLoading && profile && !profile.isAdmin) {
      router.replace('/')
    }
  }, [profile, profileLoading, router])

  async function loadProfiles() {
    setLoadingList(true)
    try {
      const res = await fetch('/api/admin/access')
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? 'Erro ao carregar acessos.')
      }
      const body = (await res.json()) as { profiles: UserProfile[] }
      setProfiles(body.profiles)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar acessos.')
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    if (profile?.isAdmin) {
      void loadProfiles()
    }
  }, [profile?.isAdmin])

  function selectDiretoria(id: string) {
    setDiretoriaId((current) => (current === id ? '' : id))
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
    setSuccess('')

    if (visao !== 'admin' && viewSections.length === 0) {
      setError('Selecione ao menos uma área visível para o usuário.')
      setSubmitting(false)
      return
    }

    const payload: CreateAccessPayload = {
      username,
      password,
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
    }

    try {
      const res = await fetch('/api/admin/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const body = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        throw new Error(body.error ?? 'Não foi possível criar o acesso.')
      }

      setSuccess('Acesso criado com sucesso.')
      setUsername('')
      setPassword('')
      setVisao('lider')
      setEsteira('GERAL')
      setDiretoriaId('')
      setDiretoriaIds([])
      setEquipeId('')
      setPermissions([])
      setViewSections(ALL_VIEW_SECTIONS)
      await loadProfiles()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar o acesso.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleEditSaved() {
    setSuccess('Acesso atualizado com sucesso.')
    await loadProfiles()
  }

  async function handleDelete(userId: string) {
    if (!window.confirm('Excluir este acesso permanentemente?')) return

    setDeletingId(userId)
    setError('')
    setSuccess('')

    try {
      const res = await fetch(`/api/admin/access?id=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      })
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        throw new Error(body.error ?? 'Não foi possível excluir o acesso.')
      }
      setSuccess('Acesso excluído.')
      await loadProfiles()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível excluir o acesso.')
    } finally {
      setDeletingId(null)
    }
  }

  if (profileLoading || !profile?.isAdmin) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="overflow-hidden rounded-2xl bg-linear-to-r from-violet-700 via-violet-600 to-indigo-700 px-6 py-8 text-white shadow-lg">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-violet-200">
              Administração
            </p>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Gestão de acesso</h1>
                <p className="mt-1 max-w-2xl text-sm text-violet-100">
                  Crie, edite ou exclua acessos. Ajuste a visão, a esteira, a diretoria e a equipe
                  de cada usuário.
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 self-start rounded-xl border border-white/20 bg-white px-4 py-2.5 text-sm font-medium text-violet-700 transition hover:bg-violet-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao dashboard
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Novo acesso</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Cria o acesso com nome de usuário, visão, esteira e escopo organizacional. Líderes e
              usuários precisam de uma diretoria e uma equipe.
            </p>
          </div>
        </div>

        {error ? (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="access-username" className={fieldLabelClass}>
                Usuário
              </label>
              <input
                id="access-username"
                type="text"
                autoComplete="off"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex.: joao.silva"
                className={fieldInputClass}
                required
                disabled={submitting}
              />
              <p className="mt-1.5 text-xs text-slate-500">
                Sem e-mail — o login usa apenas o nome de usuário.
              </p>
            </div>

            <div>
              <label htmlFor="access-password" className={fieldLabelClass}>
                Senha temporária
              </label>
              <input
                id="access-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                className={fieldInputClass}
                required
                disabled={submitting}
              />
            </div>
          </div>

          <div>
            <label htmlFor="access-visao" className={fieldLabelClass}>
              Visão
            </label>
            <select
              id="access-visao"
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
              {allowsMultipleDiretorias(visao) ? (
                <p className="mt-2 text-xs text-slate-500">
                  Deixe em branco para permitir todas as diretorias.
                </p>
              ) : (
                <p className="mt-2 text-xs text-slate-500">
                  Selecione exatamente uma diretoria para esta visão.
                </p>
              )}
            </div>
          ) : null}

          {requiresEquipe(visao) ? (
            <div>
              <label htmlFor="access-equipe" className={fieldLabelClass}>
                Equipe
              </label>
              <select
                id="access-equipe"
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
              <p className="mt-1.5 text-xs text-slate-500">
                Escolha uma das equipes da diretoria selecionada.
              </p>
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
            {visao !== 'admin' ? (
              <p className="mt-2 text-xs text-slate-500">
                Sem poderes marcados, o usuário apenas visualiza os dados.
              </p>
            ) : null}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              Criar acesso
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Acessos cadastrados
        </h2>

        {loadingList ? (
          <div className="mt-6 flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando...
          </div>
        ) : profiles.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Nenhum acesso cadastrado ainda.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-3 font-semibold">Usuário</th>
                  <th className="px-3 py-3 font-semibold">Visão</th>
                  <th className="px-3 py-3 font-semibold">Esteira</th>
                  <th className="px-3 py-3 font-semibold">Escopo</th>
                  <th className="px-3 py-3 font-semibold">Áreas visíveis</th>
                  <th className="px-3 py-3 font-semibold">Poderes</th>
                  <th className="px-3 py-3 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {profiles.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="px-3 py-3 font-medium text-slate-800 dark:text-slate-100">
                      {item.username}
                    </td>
                    <td className="px-3 py-3 capitalize text-slate-600 dark:text-slate-300">
                      {item.visao ?? item.role}
                    </td>
                    <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                      {ESTEIRA_OPTIONS.find((option) => option.value === item.esteira)?.label ??
                        item.esteira ??
                        'Todas'}
                    </td>
                    <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                      {formatProfileScope(item)}
                    </td>
                    <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                      {formatViewSectionsSummary(item, VIEW_SECTION_LABELS)}
                    </td>
                    <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                      {formatPermissionsSummary(item, PERMISSION_LABELS)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingProfile(item)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-violet-700 transition hover:bg-violet-50 dark:text-violet-300 dark:hover:bg-violet-500/10"
                        >
                          <Pencil className="h-4 w-4" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          {deletingId === item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editingProfile ? (
        <EditAccessModal
          profile={editingProfile}
          onClose={() => setEditingProfile(null)}
          onSaved={handleEditSaved}
        />
      ) : null}
    </div>
  )
}
