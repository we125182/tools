import { CornerDownLeft, Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export type CommandItem = {
  id: string
  label: string
  keywords: string
  onSelect: () => void
}

type CommandProps = {
  items: CommandItem[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function Command({ items, open, onOpenChange }: CommandProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const matchingItems = normalizedQuery
    ? items.filter((item) => `${item.label} ${item.keywords}`.toLocaleLowerCase().includes(normalizedQuery))
    : items

  useEffect(() => {
    if (!open) return

    setQuery('')
    setSelectedIndex(0)
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus())
    return () => window.cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  if (!open) return null

  const close = () => onOpenChange(false)
  const executeItem = (item: CommandItem) => {
    item.onSelect()
    close()
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      close()
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (matchingItems.length === 0) return
      setSelectedIndex((index) => Math.min(index + 1, matchingItems.length - 1))
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (matchingItems.length === 0) return
      setSelectedIndex((index) => Math.max(index - 1, 0))
      return
    }

    if (event.key === 'Enter' && matchingItems[selectedIndex]) {
      event.preventDefault()
      executeItem(matchingItems[selectedIndex])
    }
  }

  return createPortal(
    <div
      className="command-dialog fixed inset-0 z-50 flex items-start justify-center bg-black/20 px-4 pt-[18vh]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close()
      }}
    >
      <section className="w-full max-w-xl overflow-hidden rounded-md border bg-popover shadow-xl" role="dialog" aria-modal="true" aria-labelledby="command-title">
        <div className="flex h-10 items-center border-b px-3">
          <span id="command-title" className="text-sm font-medium text-popover-foreground">命令面板</span>
          <button
            type="button"
            className="ml-auto flex size-7 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="关闭命令面板"
            onClick={close}
          >
            <X size={15} />
          </button>
        </div>
        <div className="relative border-b">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            className="h-11 w-full bg-transparent py-0 pl-10 pr-3 text-sm text-popover-foreground outline-none placeholder:text-muted-foreground"
            type="text"
            role="combobox"
            aria-label="搜索命令"
            aria-autocomplete="list"
            aria-controls="command-list"
            aria-expanded="true"
            aria-activedescendant={matchingItems[selectedIndex] ? `command-${matchingItems[selectedIndex].id}` : undefined}
            placeholder="输入命令"
          />
        </div>
        <div id="command-list" className="max-h-72 overflow-y-auto p-1.5" role="listbox" aria-label="可用命令">
          {matchingItems.length === 0 ? (
            <p className="px-2 py-5 text-center text-sm text-muted-foreground">未找到命令</p>
          ) : (
            matchingItems.map((item, index) => (
              <button
                key={item.id}
                id={`command-${item.id}`}
                type="button"
                className={`flex h-9 w-full items-center rounded-sm px-2.5 text-left text-sm ${index === selectedIndex ? 'bg-accent text-accent-foreground' : 'text-popover-foreground hover:bg-accent'}`}
                role="option"
                aria-selected={index === selectedIndex}
                onClick={() => executeItem(item)}
              >
                {item.label}
                <CornerDownLeft className="ml-auto text-muted-foreground" size={14} aria-hidden="true" />
              </button>
            ))
          )}
        </div>
      </section>
    </div>,
    document.body,
  )
}
