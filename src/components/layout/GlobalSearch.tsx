import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, FolderOpen, Pill, Search as SearchIcon, Sparkles } from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import { Modal } from '@/components/common/Modal'
import { dataSearchService } from '@/services/searchService'
import type { SearchResult } from '@/services/searchService'
import { useAppData } from '@/context/DataContext'
import { cn } from '@/utils/cn'

const KIND_ICON = {
  record: FolderOpen,
  appointment: CalendarDays,
  medication: Pill,
} as const

export interface GlobalSearchProps {
  open: boolean
  onClose: () => void
}

export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const { records, appointments, medications } = useAppData()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const results = useMemo<SearchResult[]>(
    () => (query.trim() ? dataSearchService.search(query, { records, appointments, medications }) : []),
    [query, records, appointments, medications],
  )

  const go = (result: SearchResult) => {
    onClose()
    setQuery('')
    navigate(result.to)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => (index + 1) % results.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => (index - 1 + results.length) % results.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const target = results[activeIndex]
      if (target) go(target)
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        onClose()
        setQuery('')
      }}
      title="Search your health data"
      description="Looks through the records, appointments and medicines stored in this browser."
      initialFocusRef={inputRef}
    >
      <div>
        <div className="relative">
          <SearchIcon
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setActiveIndex(0)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search records, appointments, medicines…"
            aria-label="Search records, appointments and medicines"
            aria-controls="global-search-results"
            className="hc-input pl-9"
          />
        </div>

        <div id="global-search-results" role="listbox" aria-label="Search results" className="mt-3 max-h-[45vh] overflow-y-auto hc-scroll">
          {!query.trim() ? (
            <p className="flex items-center gap-2 rounded-lg bg-surface-2 px-3 py-3 text-xs text-muted">
              <Sparkles aria-hidden="true" className="size-3.5 shrink-0" />
              Try “lipid”, “Dr. Chen”, “vitamin” or “cleaning”. Health Copilot never leaves your browser.
            </p>
          ) : results.length === 0 ? (
            <p className="px-1 py-4 text-center text-sm text-muted">
              No matches in your data for “{query}”.
            </p>
          ) : (
            <ul className="space-y-1">
              {results.map((result, index) => {
                const Icon = KIND_ICON[result.kind]
                return (
                  <li key={result.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={index === activeIndex}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => go(result)}
                      className={cn(
                        'flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                        index === activeIndex ? 'bg-brand-50 dark:bg-brand-500/15' : 'hover:bg-surface-2',
                      )}
                    >
                      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-muted">
                        <Icon aria-hidden="true" className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold text-ink">{result.title}</span>
                          <Badge tone="neutral" className="hidden sm:inline-flex">
                            {result.kindLabel}
                          </Badge>
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted">{result.subtitle}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  )
}
