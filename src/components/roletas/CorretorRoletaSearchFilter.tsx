'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import { Search, X } from 'lucide-react'
import type { StuppCorretorOption } from '@/lib/orgPreview'
import {
  filterLabelClass,
  roletaFilterControlClass,
  roletaFilterFieldClass,
  roletaFilterHintClass,
} from '@/components/ui/styles'

interface Props {
  value: string
  options: StuppCorretorOption[]
  onChange: (value: string) => void
  isLoading?: boolean
}

export function CorretorRoletaSearchFilter({
  value,
  options,
  onChange,
  isLoading,
}: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = options.find((item) => item.id === value)

  useEffect(() => {
    if (selected) {
      setQuery(selected.name)
    } else if (!value) {
      setQuery('')
    }
  }, [selected, value])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
        if (selected) {
          setQuery(selected.name)
        } else if (!value) {
          setQuery('')
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [selected, value])

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return options.slice(0, 40)

    return options
      .filter((corretor) =>
        [corretor.name, corretor.equipe, corretor.diretoria].some((part) =>
          part.toLowerCase().includes(normalized)
        )
      )
      .slice(0, 40)
  }, [options, query])

  function handleSelect(corretor: StuppCorretorOption) {
    onChange(corretor.id)
    setQuery(corretor.name)
    setOpen(false)
  }

  function handleClear() {
    onChange('')
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={containerRef} className={roletaFilterFieldClass}>
      <label className={filterLabelClass}>Buscar corretor</label>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        <input
          type="search"
          value={query}
          disabled={isLoading}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
            if (value) onChange('')
          }}
          onFocus={() => setOpen(true)}
          placeholder="Nome, equipe ou diretoria"
          className={clsx(roletaFilterControlClass, 'pl-9 pr-9')}
        />
        {value ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
            aria-label="Limpar busca"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}

        {open && !isLoading ? (
          <ul className="absolute top-full z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-600 dark:bg-slate-800">
            {filtered.length > 0 ? (
              filtered.map((corretor) => (
                <li key={corretor.id}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSelect(corretor)}
                    className={clsx(
                      'flex w-full flex-col gap-0.5 px-3 py-2 text-left text-sm transition hover:bg-slate-50 dark:hover:bg-slate-700/80',
                      value === corretor.id && 'bg-brand-50 dark:bg-brand-500/10'
                    )}
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-100">
                      {corretor.name}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {corretor.equipe} · {corretor.diretoria}
                    </span>
                  </button>
                </li>
              ))
            ) : (
              <li className="px-3 py-3 text-sm text-slate-500 dark:text-slate-400">
                Nenhum corretor encontrado.
              </li>
            )}
          </ul>
        ) : null}
      </div>

      <p className={roletaFilterHintClass}>
        {selected
          ? `${selected.diretoria} · ${selected.equipe}`
          : 'Corretores Stüpp cadastrados em roletas'}
      </p>
    </div>
  )
}
