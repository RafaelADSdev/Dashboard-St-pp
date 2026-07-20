'use client'

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import {
  Building2,
  Calendar,
  CircleDot,
  GripVertical,
  Loader2,
  Megaphone,
  UserRound,
  X,
  ArrowRightLeft,
  Search,
  CheckSquare,
  Square,
  Users,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTheme } from 'next-themes'
import type { KanbanBoard, KanbanCard, KanbanStage } from '@/api/types'
import { useStuppStructurePreview } from '@/hooks/useStuppOrg'
import { useUserPermissions } from '@/hooks/useUserPermissions'
import type { StuppCorretorOption } from '@/lib/orgPreview'
import { getStageChartColor, withAlpha } from '@/lib/stageColors'
import { formatBitrixDateOnly } from '@/utils/leadTiming'
import { moveKanbanCard, updateKanbanCardAssignee, updateKanbanCardsAssignee } from '@/utils/buildKanbanBoards'

interface Props {
  boards: KanbanBoard[]
  expanded?: boolean
}

type SelectedCard = {
  card: KanbanCard
  stageName: string
  stageColor: string
}

type DragData = {
  type: 'card'
  card: KanbanCard
  stageId: string
  boardCategoryId: string
}

type DropData = {
  type: 'column'
  stageId: string
  boardCategoryId: string
}

function columnDropId(boardCategoryId: string, stageId: string) {
  return `column-${boardCategoryId}-${stageId.replace(/:/g, '_')}`
}

function cardDragId(cardId: string) {
  return `card-${cardId}`
}

function KanbanAssignCorretor({
  corretores,
  onTransfer,
  isPending,
  error,
  excludeAssigneeId,
  title = 'Transferir para outro corretor',
  submitLabel = 'Transferir lead',
  resetKey = 'default',
}: {
  corretores: StuppCorretorOption[]
  onTransfer: (corretor: StuppCorretorOption) => void
  isPending: boolean
  error?: string
  excludeAssigneeId?: string
  title?: string
  submitLabel?: string
  resetKey?: string
}) {
  const [query, setQuery] = useState('')
  const [targetId, setTargetId] = useState('')

  useEffect(() => {
    setQuery('')
    setTargetId('')
  }, [resetKey])

  const available = useMemo(
    () =>
      excludeAssigneeId
        ? corretores.filter((corretor) => corretor.id !== excludeAssigneeId)
        : corretores,
    [corretores, excludeAssigneeId]
  )

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return available
    return available.filter((corretor) =>
      [corretor.name, corretor.equipe, corretor.diretoria].some((value) =>
        value.toLowerCase().includes(normalized)
      )
    )
  }, [available, query])

  const selectedCorretor = available.find((corretor) => corretor.id === targetId)

  return (
    <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-4">
      <div className="mb-3 flex items-center gap-2">
        <ArrowRightLeft className="h-4 w-4 text-blue-700" />
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h4>
      </div>

      <div className="relative mb-2">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar corretor, equipe ou diretoria"
          className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-3 text-sm text-slate-800 dark:text-slate-200 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-400/15"
        />
      </div>

      <select
        value={targetId}
        onChange={(event) => setTargetId(event.target.value)}
        className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm text-slate-800 dark:text-slate-200 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-400/15"
      >
        <option value="">Selecione o novo responsável</option>
        {filtered.map((corretor) => (
          <option key={corretor.id} value={corretor.id}>
            {corretor.name} · {corretor.equipe}
          </option>
        ))}
      </select>

      {selectedCorretor ? (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {selectedCorretor.diretoria} · {selectedCorretor.equipe}
        </p>
      ) : null}

      {error ? (
        <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        disabled={!selectedCorretor || isPending}
        onClick={() => selectedCorretor && onTransfer(selectedCorretor)}
        className={clsx(
          'mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors',
          !selectedCorretor || isPending
            ? 'cursor-not-allowed bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
            : 'bg-blue-900 text-white hover:bg-blue-950'
        )}
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {isPending ? 'Transferindo...' : submitLabel}
      </button>
    </div>
  )
}

function KanbanLeadModal({
  selected,
  onClose,
  corretores,
  onTransfer,
  isTransferring,
  transferError,
  canTransfer,
}: {
  selected: SelectedCard
  onClose: () => void
  corretores: StuppCorretorOption[]
  onTransfer: (corretor: StuppCorretorOption) => void
  isTransferring: boolean
  transferError?: string
  canTransfer: boolean
}) {
  const { card, stageName, stageColor } = selected
  const fields = [
    { icon: UserRound, label: 'Responsável', value: card.assignedByName },
    { icon: Building2, label: 'Diretoria', value: card.diretoria },
    { icon: CircleDot, label: 'Roleta', value: card.roleta },
    { icon: Megaphone, label: 'Origem', value: card.source },
    { icon: Calendar, label: 'Data de entrada', value: formatBitrixDateOnly(card.dateCreate) },
  ]

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="kanban-lead-modal-title"
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="h-2 shrink-0" style={{ backgroundColor: stageColor }} />

        <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 px-5 py-4">
          <div className="min-w-0">
            <span
              className="inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              style={{ backgroundColor: withAlpha(stageColor, 0.14), color: stageColor }}
            >
              {stageName}
            </span>
            <h2
              id="kanban-lead-modal-title"
              className="mt-2 text-lg font-semibold leading-snug text-slate-900 dark:text-slate-100"
            >
              {card.title}
            </h2>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Negócio #{card.id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 dark:text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto">
          <dl className="grid gap-3 px-5 py-4 sm:grid-cols-2">
            {fields.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 dark:border-slate-700 dark:bg-slate-900/50"
              >
                <dt className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {label}
                </dt>
                <dd className="mt-1.5 text-sm leading-snug text-slate-800 dark:text-slate-200 wrap-break-word">{value}</dd>
              </div>
            ))}
          </dl>

          {canTransfer ? (
            <KanbanAssignCorretor
              corretores={corretores}
              onTransfer={onTransfer}
              isPending={isTransferring}
              error={transferError}
              excludeAssigneeId={card.assignedById}
              resetKey={card.id}
            />
          ) : (
            <p className="border-t border-slate-100 px-5 py-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
              Você não tem permissão para transferir leads.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function KanbanBatchModal({
  count,
  corretores,
  onClose,
  onTransfer,
  isPending,
  error,
}: {
  count: number
  corretores: StuppCorretorOption[]
  onClose: () => void
  onTransfer: (corretor: StuppCorretorOption) => void
  isPending: boolean
  error?: string
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]" aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="kanban-batch-modal-title"
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 px-5 py-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-950/60 dark:text-blue-200">
              <Users className="h-3.5 w-3.5" />
              Transferência em lote
            </div>
            <h2 id="kanban-batch-modal-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Transferir {count} lead{count === 1 ? '' : 's'}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Escolha o corretor que passará a ser responsável por todas as negociações selecionadas.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 dark:text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <KanbanAssignCorretor
          corretores={corretores}
          onTransfer={onTransfer}
          isPending={isPending}
          error={error}
          title="Novo responsável"
          submitLabel={`Transferir ${count} lead${count === 1 ? '' : 's'}`}
          resetKey={`batch-${count}`}
        />
      </div>
    </div>
  )
}

function KanbanDealCard({
  card,
  stageId,
  boardCategoryId,
  stageColor,
  isDetailSelected,
  isBatchSelected,
  batchMode,
  onSelect,
  onToggleBatch,
  canDrag = true,
  isOverlay = false,
}: {
  card: KanbanCard
  stageId: string
  boardCategoryId: string
  stageColor: string
  isDetailSelected?: boolean
  isBatchSelected?: boolean
  batchMode?: boolean
  onSelect?: (card: KanbanCard) => void
  onToggleBatch?: (card: KanbanCard) => void
  canDrag?: boolean
  isOverlay?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: cardDragId(card.id),
    data: { type: 'card', card, stageId, boardCategoryId } satisfies DragData,
    disabled: !canDrag || (batchMode && !isOverlay),
  })

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined

  return (
    <article
      ref={isOverlay ? undefined : setNodeRef}
      style={{
        ...style,
        borderLeftColor: stageColor,
        boxShadow: isOverlay ? `0 10px 24px ${withAlpha(stageColor, 0.22)}` : undefined,
      }}
      className={clsx(
        'rounded-lg border border-slate-200 border-l-4 bg-white shadow-sm transition-all dark:border-slate-600/80 dark:bg-slate-800 dark:shadow-black/20',
        (isDetailSelected || isBatchSelected) &&
          'ring-2 ring-blue-500/40 ring-offset-1 dark:ring-offset-slate-900',
        isBatchSelected && batchMode && 'bg-blue-50/40 dark:bg-blue-950/35',
        isOverlay && 'rotate-1 ring-2 ring-white/80 dark:ring-slate-500/60',
        isDragging && !isOverlay && 'opacity-35'
      )}
    >
      <div className="flex items-start gap-1.5 p-2.5">
        {batchMode && !isOverlay ? (
          <button
            type="button"
            onClick={() => onToggleBatch?.(card)}
            className="mt-1 shrink-0 rounded p-0.5 text-blue-700 transition-colors hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950/50"
            aria-label={isBatchSelected ? 'Desmarcar lead' : 'Selecionar lead'}
          >
            {isBatchSelected ? (
              <CheckSquare className="h-4 w-4" />
            ) : (
              <Square className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            )}
          </button>
        ) : canDrag ? (
          <button
            type="button"
            className="mt-1 shrink-0 cursor-grab rounded p-0.5 text-slate-300 dark:text-slate-600 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-500 dark:hover:text-slate-400 active:cursor-grabbing"
            aria-label={`Mover ${card.title}`}
            {...listeners}
            {...attributes}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        ) : (
          <span className="mt-1 inline-flex h-5 w-5 shrink-0" aria-hidden />
        )}

        <button
          type="button"
          onClick={() => (batchMode ? onToggleBatch?.(card) : onSelect?.(card))}
          className="min-w-0 flex-1 text-left"
        >
          <h4 className="text-[13px] font-semibold leading-snug text-slate-900 dark:text-slate-100">{card.title}</h4>
          <p className="mt-1 truncate text-xs text-slate-600 dark:text-slate-400">{card.assignedByName}</p>
          <p className="mt-0.5 truncate text-[11px] text-slate-400 dark:text-slate-500">{card.diretoria}</p>
          <div className="mt-1.5 space-y-0.5 text-[10px] leading-tight text-slate-400 dark:text-slate-500">
            <p>
              <span className="font-medium text-slate-500 dark:text-slate-400">Entrada:</span>{' '}
              {formatBitrixDateOnly(card.dateCreate)}
            </p>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            <span
              className="max-w-full truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: withAlpha(stageColor, 0.18), color: stageColor }}
              title={card.roleta}
            >
              {card.roleta}
            </span>
            <span
              className="max-w-full truncate rounded-md bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-400"
              title={card.source}
            >
              {card.source}
            </span>
          </div>
        </button>
      </div>
    </article>
  )
}

function KanbanColumn({
  stage,
  boardCategoryId,
  stageIndex,
  detailSelectedId,
  batchSelectedIds,
  batchMode,
  onSelectCard,
  onToggleBatch,
  canDrag = true,
  expanded = false,
}: {
  stage: KanbanStage
  boardCategoryId: string
  stageIndex: number
  detailSelectedId?: string
  batchSelectedIds: Set<string>
  batchMode: boolean
  onSelectCard: (card: KanbanCard, stageName: string, stageColor: string) => void
  onToggleBatch: (card: KanbanCard) => void
  canDrag?: boolean
  expanded?: boolean
}) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const stageColor = getStageChartColor(stageIndex)
  const columnBase = isDark ? '#1e293b' : '#f5f5f5'
  const columnBodyTint = withAlpha(stageColor, isDark ? 0.1 : 0.03)

  const { setNodeRef, isOver } = useDroppable({
    id: columnDropId(boardCategoryId, stage.id),
    data: { type: 'column', stageId: stage.id, boardCategoryId } satisfies DropData,
  })

  return (
    <section
      ref={setNodeRef}
      style={{
        boxShadow: isOver ? `0 0 0 2px ${withAlpha(stageColor, 0.35)}` : undefined,
      }}
      className={clsx(
        'flex w-[320px] shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm dark:border-slate-600/80 dark:bg-slate-900/60',
        isOver && 'ring-2 ring-inset'
      )}
    >
      <header
        className="border-b border-slate-200 dark:border-slate-600/80"
        style={{
          background: `linear-gradient(180deg, ${withAlpha(stageColor, isDark ? 0.22 : 0.14)} 0%, ${columnBase} 100%)`,
        }}
      >
        <div className="h-2.5" style={{ backgroundColor: stageColor }} />
        <div className="flex items-start justify-between gap-2 px-3 py-3">
          <h3 className="line-clamp-2 flex-1 text-sm font-semibold leading-snug text-slate-800 dark:text-slate-200">
            {stage.name}
          </h3>
          <span
            className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums"
            style={{ backgroundColor: withAlpha(stageColor, 0.16), color: stageColor }}
          >
            {stage.cards.length}
          </span>
        </div>
      </header>

      <div
        className={clsx(
          'flex min-h-[140px] flex-1 flex-col gap-2 overflow-y-auto p-2',
          expanded ? 'max-h-[620px]' : 'max-h-[480px]'
        )}
        style={{ backgroundColor: columnBodyTint }}
      >
        {stage.cards.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 bg-white/80 px-2 py-10 text-center text-xs text-slate-400 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-500">
            Sem negociações
          </p>
        ) : (
          stage.cards.map((card) => (
            <KanbanDealCard
              key={card.id}
              card={card}
              stageId={stage.id}
              boardCategoryId={boardCategoryId}
              stageColor={stageColor}
              isDetailSelected={detailSelectedId === card.id}
              isBatchSelected={batchSelectedIds.has(card.id)}
              batchMode={batchMode}
              canDrag={canDrag}
              onSelect={(item) => onSelectCard(item, stage.name, stageColor)}
              onToggleBatch={onToggleBatch}
            />
          ))
        )}
      </div>
    </section>
  )
}

function KanbanBoardView({
  board,
  onMove,
  isMoving,
  detailSelectedId,
  batchSelectedIds,
  batchMode,
  onSelectCard,
  onToggleBatch,
  canDrag = true,
  expanded = false,
}: {
  board: KanbanBoard
  onMove: (cardId: string, fromStageId: string, toStageId: string, boardCategoryId: string) => void
  isMoving: boolean
  detailSelectedId?: string
  batchSelectedIds: Set<string>
  batchMode: boolean
  onSelectCard: (card: KanbanCard, stageName: string, stageColor: string) => void
  onToggleBatch: (card: KanbanCard) => void
  canDrag?: boolean
  expanded?: boolean
}) {
  const [activeDrag, setActiveDrag] = useState<DragData | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  function resolveTargetStageId(overData: DropData | DragData | undefined) {
    if (overData?.type === 'column') return overData.stageId
    if (overData?.type === 'card') return overData.stageId
    return null
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveDrag(event.active.data.current as DragData)
  }

  function handleDragEnd(event: DragEndEvent) {
    const activeData = event.active.data.current as DragData | undefined
    const overData = event.over?.data.current as DropData | DragData | undefined
    setActiveDrag(null)

    if (!activeData || !event.over) return

    const targetStageId = resolveTargetStageId(overData)
    if (!targetStageId || targetStageId === activeData.stageId) return

    onMove(activeData.card.id, activeData.stageId, targetStageId, activeData.boardCategoryId)
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="relative min-w-0 flex-1">
        {isMoving ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800/60 backdrop-blur-[1px]">
            <Loader2 className="h-5 w-5 animate-spin text-blue-700" />
          </div>
        ) : null}

        <div className="flex gap-3 overflow-x-auto pb-2 pt-1">
          {board.stages.map((stage, index) => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              boardCategoryId={board.categoryId}
              stageIndex={index}
              detailSelectedId={detailSelectedId}
              batchSelectedIds={batchSelectedIds}
              batchMode={batchMode}
              canDrag={canDrag}
              onSelectCard={onSelectCard}
              onToggleBatch={onToggleBatch}
              expanded={expanded}
            />
          ))}
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: 'ease-out' }}>
        {activeDrag ? (
          <KanbanDealCard
            card={activeDrag.card}
            stageId={activeDrag.stageId}
            boardCategoryId={activeDrag.boardCategoryId}
            stageColor={getStageChartColor(
              Math.max(0, board.stages.findIndex((stage) => stage.id === activeDrag.stageId))
            )}
            isOverlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

export function LeadsKanbanBoard({ boards, expanded = false }: Props) {
  const queryClient = useQueryClient()
  const { data: orgPreview } = useStuppStructurePreview()
  const { canMoveEsteira, canTransferLeads } = useUserPermissions()
  const [localBoards, setLocalBoards] = useState(boards)
  const [error, setError] = useState('')
  const [transferError, setTransferError] = useState('')
  const [batchTransferError, setBatchTransferError] = useState('')
  const [selected, setSelected] = useState<SelectedCard | null>(null)
  const [batchMode, setBatchMode] = useState(false)
  const [batchSelectedIds, setBatchSelectedIds] = useState<Set<string>>(() => new Set())
  const [batchModalOpen, setBatchModalOpen] = useState(false)

  const corretores = orgPreview?.corretores ?? []
  const batchCount = batchSelectedIds.size

  useEffect(() => {
    setLocalBoards(boards)
  }, [boards])

  useEffect(() => {
    if (!selected) return
    const match = localBoards
      .flatMap((board) => board.stages)
      .flatMap((stage) => stage.cards)
      .find((card) => card.id === selected.card.id)

    if (!match) {
      setSelected(null)
      return
    }

    if (
      match.assignedById !== selected.card.assignedById ||
      match.assignedByName !== selected.card.assignedByName ||
      match.diretoria !== selected.card.diretoria ||
      match.equipe !== selected.card.equipe
    ) {
      setSelected((current) =>
        current ? { ...current, card: match } : current
      )
    }
  }, [localBoards, selected])

  const assignBatchMutation = useMutation({
    mutationFn: async ({
      dealIds,
      assignedById,
      assignee: _assignee,
    }: {
      dealIds: string[]
      assignedById: string
      assignee: Pick<KanbanCard, 'assignedById' | 'assignedByName' | 'diretoria' | 'equipe'>
    }) => {
      const res = await fetch('/api/deals/assign/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealIds, assignedById }),
      })

      const body = (await res.json().catch(() => ({}))) as {
        error?: string
        succeeded?: string[]
        failed?: { dealId: string; error: string }[]
      }

      if (!res.ok && !body.succeeded?.length) {
        throw new Error(body.error ?? 'Não foi possível transferir as negociações')
      }

      return body
    },
    onMutate: ({ dealIds, assignee }) => {
      setBatchTransferError('')
      const previous = localBoards
      setLocalBoards((current) => updateKanbanCardsAssignee(current, dealIds, assignee))
      return { previous }
    },
    onSuccess: (data, variables) => {
      const succeeded = data.succeeded ?? variables.dealIds
      const failedCount = data.failed?.length ?? 0

      if (failedCount > 0) {
        setBatchTransferError(
          `${succeeded.length} transferida(s), ${failedCount} falhou(aram). Tente novamente as restantes.`
        )
        if (data.failed?.length) {
          setBatchSelectedIds(new Set(data.failed.map((item) => item.dealId)))
        }
      } else {
        setBatchModalOpen(false)
        setBatchMode(false)
        setBatchSelectedIds(new Set())
      }
    },
    onError: (err, _vars, context) => {
      setBatchTransferError(err instanceof Error ? err.message : 'Erro ao transferir em lote')
      if (context?.previous) setLocalBoards(context.previous)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['leads'] })
    },
  })

  const assignMutation = useMutation({
    mutationFn: async ({
      dealId,
      assignedById,
      assignee: _assignee,
    }: {
      dealId: string
      assignedById: string
      assignee: Pick<KanbanCard, 'assignedById' | 'assignedByName' | 'diretoria' | 'equipe'>
    }) => {
      const res = await fetch('/api/deals/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId, assignedById }),
      })

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? 'Não foi possível transferir a negociação')
      }
    },
    onMutate: ({ dealId, assignee }) => {
      setTransferError('')
      const previous = localBoards
      setLocalBoards((current) => updateKanbanCardAssignee(current, dealId, assignee))
      return { previous }
    },
    onError: (err, _vars, context) => {
      setTransferError(err instanceof Error ? err.message : 'Erro ao transferir negociação')
      if (context?.previous) setLocalBoards(context.previous)
    },
    onSuccess: (_data, variables) => {
      setSelected((current) =>
        current?.card.id === variables.dealId
          ? { ...current, card: { ...current.card, ...variables.assignee } }
          : current
      )
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['leads'] })
    },
  })

  const moveMutation = useMutation({
    mutationFn: async ({ dealId, stageId }: { dealId: string; stageId: string }) => {
      const res = await fetch('/api/deals/stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId, stageId }),
      })

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? 'Não foi possível mover a negociação')
      }
    },
    onMutate: ({ dealId, stageId }) => {
      setError('')
      const previous = localBoards
      setLocalBoards((current) => moveKanbanCard(current, dealId, stageId))
      return { previous }
    },
    onError: (err, _vars, context) => {
      setError(err instanceof Error ? err.message : 'Erro ao mover negociação')
      if (context?.previous) setLocalBoards(context.previous)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['leads'] })
    },
  })

  function handleMove(
    cardId: string,
    _fromStageId: string,
    toStageId: string,
    _boardCategoryId: string
  ) {
    if (!canMoveEsteira) return
    moveMutation.mutate({ dealId: cardId, stageId: toStageId })
  }

  function handleSelectCard(card: KanbanCard, stageName: string, stageColor: string) {
    if (batchMode) return
    setTransferError('')
    setSelected({ card, stageName, stageColor })
  }

  function handleToggleBatch(card: KanbanCard) {
    setBatchSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(card.id)) next.delete(card.id)
      else next.add(card.id)
      return next
    })
  }

  function handleStartBatchMode() {
    if (!canTransferLeads) return
    setSelected(null)
    setBatchMode(true)
    setBatchSelectedIds(new Set())
    setBatchTransferError('')
  }

  function handleCancelBatchMode() {
    setBatchMode(false)
    setBatchSelectedIds(new Set())
    setBatchModalOpen(false)
    setBatchTransferError('')
  }

  function handleTransferBatch(corretor: StuppCorretorOption) {
    const dealIds = [...batchSelectedIds]
    if (dealIds.length === 0) return

    assignBatchMutation.mutate({
      dealIds,
      assignedById: corretor.id,
      assignee: {
        assignedById: corretor.id,
        assignedByName: corretor.name,
        diretoria: corretor.diretoria,
        equipe: corretor.equipe,
      },
    })
  }

  function handleTransferCorretor(corretor: StuppCorretorOption) {
    if (!selected) return
    assignMutation.mutate({
      dealId: selected.card.id,
      assignedById: corretor.id,
      assignee: {
        assignedById: corretor.id,
        assignedByName: corretor.name,
        diretoria: corretor.diretoria,
        equipe: corretor.equipe,
      },
    })
  }

  if (localBoards.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">Nenhuma fase disponível no CRM.</p>
    )
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      ) : null}

      {batchMode ? (
        <div className="flex flex-col gap-3 rounded-xl border border-blue-200 bg-blue-50/80 px-4 py-3 dark:border-blue-800/60 dark:bg-blue-950/35 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-950 dark:text-blue-100">Modo lote ativo</p>
            <p className="text-xs text-blue-800/80 dark:text-blue-300/80">
              {batchCount === 0
                ? 'Marque os leads que deseja transferir'
                : `${batchCount} lead${batchCount === 1 ? '' : 's'} selecionado${batchCount === 1 ? '' : 's'}`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setBatchSelectedIds(new Set())}
              disabled={batchCount === 0}
              className="rounded-lg px-3 py-2 text-sm font-medium text-blue-900 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-blue-200 dark:hover:bg-blue-900/50"
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={() => setBatchModalOpen(true)}
              disabled={batchCount === 0 || assignBatchMutation.isPending}
              className="rounded-lg bg-blue-900 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Transferir em lote
            </button>
            <button
              type="button"
              onClick={handleCancelBatchMode}
              className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-blue-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : canTransferLeads ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleStartBatchMode}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Users className="h-4 w-4" />
            Selecionar em lote
          </button>
        </div>
      ) : null}

      {localBoards.map((board) => (
        <div key={board.categoryId} className="space-y-3">
          {localBoards.length > 1 ? (
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{board.title}</h3>
          ) : null}

          <KanbanBoardView
            board={board}
            onMove={handleMove}
            isMoving={moveMutation.isPending}
            detailSelectedId={selected?.card.id}
            batchSelectedIds={batchSelectedIds}
            batchMode={batchMode}
            canDrag={canMoveEsteira}
            onSelectCard={handleSelectCard}
            onToggleBatch={handleToggleBatch}
            expanded={expanded}
          />
        </div>
      ))}

      {selected && !batchMode ? (
        <KanbanLeadModal
          selected={selected}
          onClose={() => setSelected(null)}
          corretores={corretores}
          onTransfer={handleTransferCorretor}
          isTransferring={assignMutation.isPending}
          transferError={transferError}
          canTransfer={canTransferLeads}
        />
      ) : null}

      {batchModalOpen && batchMode ? (
        <KanbanBatchModal
          count={batchCount}
          corretores={corretores}
          onClose={() => setBatchModalOpen(false)}
          onTransfer={handleTransferBatch}
          isPending={assignBatchMutation.isPending}
          error={batchTransferError}
        />
      ) : null}

      <p className="text-xs text-slate-400 dark:text-slate-500">
        {batchMode
          ? 'Marque os cards desejados e use “Transferir em lote”'
          : canMoveEsteira && canTransferLeads
            ? 'Clique no card para abrir os detalhes · Arraste pelo ícone ⋮⋮ para mover fases · Use “Selecionar em lote” para transferir leads'
            : canMoveEsteira
              ? 'Clique no card para abrir os detalhes · Arraste pelo ícone ⋮⋮ para mover fases'
              : canTransferLeads
                ? 'Clique no card para abrir os detalhes · Use “Selecionar em lote” para transferir leads'
                : 'Clique no card para visualizar os detalhes do lead'}
      </p>
    </div>
  )
}
