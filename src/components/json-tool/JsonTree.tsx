import { ChevronDown, ChevronRight, Copy, FileJson, FolderMinus, FolderPlus } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { beautify, pathKey, summary, typeOf, type PathSegment } from '@/lib/jsonc'
import type { SortMode } from '@/stores/json'

export interface JsonTreeController {
  indentSize: '2' | '4'
  sortMode: SortMode
  query: string
  matchedPathKeys: Set<string>
  currentMatchKey: string | null
  isExpanded: (segments: PathSegment[], depth: number) => boolean
  setExpanded: (segments: PathSegment[], expanded: boolean) => void
  toggleExpanded: (segments: PathSegment[], depth: number) => void
}

interface ContextMenuState {
  x: number
  y: number
  nodeKey: string
  segments: PathSegment[]
  value: unknown
  isContainer: boolean
  hasChildren: boolean
}

interface JsonTreeProps {
  value: unknown
  hasValue?: boolean
  controller: JsonTreeController
}

function getEntries(value: unknown, sortMode: SortMode): Array<[string | number, unknown]> {
  if (Array.isArray(value)) return value.map((item, index) => [index, item])
  if (!value || typeof value !== 'object') return []
  const entries = Object.entries(value)
  if (sortMode === 'default') return entries
  const direction = sortMode === 'asc' ? 1 : -1
  return entries.sort(([left], [right]) => direction * left.localeCompare(right, 'zh-Hans-CN', {
    numeric: true,
    sensitivity: 'base',
  }))
}

function highlightedParts(text: string, query: string) {
  const term = query.trim().toLowerCase()
  if (!term) return [{ text, match: false }]
  const parts: Array<{ text: string; match: boolean }> = []
  let offset = 0
  let matchIndex = text.toLowerCase().indexOf(term, offset)
  while (matchIndex !== -1) {
    if (matchIndex > offset) parts.push({ text: text.slice(offset, matchIndex), match: false })
    parts.push({ text: text.slice(matchIndex, matchIndex + term.length), match: true })
    offset = matchIndex + term.length
    matchIndex = text.toLowerCase().indexOf(term, offset)
  }
  if (offset < text.length) parts.push({ text: text.slice(offset), match: false })
  return parts.length ? parts : [{ text, match: false }]
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  return highlightedParts(text, query).map((part, index) => part.match
    ? <mark className="rounded-sm bg-amber-200 px-px text-inherit dark:bg-amber-500/40" key={`${part.text}-${index}`}>{part.text}</mark>
    : <span key={`${part.text}-${index}`}>{part.text}</span>)
}

async function copyText(text: string) {
  await navigator.clipboard?.writeText(text)
}

function setSubtreeExpansion(value: unknown, segments: PathSegment[], expanded: boolean, controller: JsonTreeController) {
  if (Array.isArray(value)) {
    controller.setExpanded(segments, expanded)
    value.forEach((item, index) => setSubtreeExpansion(item, [...segments, index], expanded, controller))
  } else if (value && typeof value === 'object') {
    controller.setExpanded(segments, expanded)
    Object.entries(value).forEach(([key, item]) => setSubtreeExpansion(item, [...segments, key], expanded, controller))
  }
}

function JsonNode({
  value,
  keyName,
  segments,
  depth,
  isLast,
  controller,
  openContextMenu,
}: {
  value: unknown
  keyName?: string | number
  segments: PathSegment[]
  depth: number
  isLast: boolean
  controller: JsonTreeController
  openContextMenu: (event: MouseEvent, context: Omit<ContextMenuState, 'x' | 'y'>) => void
}) {
  const rowRef = useRef<HTMLDivElement>(null)
  const nodeType = typeOf(value)
  const isContainer = nodeType === 'object' || nodeType === 'array'
  const entries = useMemo(() => getEntries(value, controller.sortMode), [value, controller.sortMode])
  const hasChildren = entries.length > 0
  const expanded = isContainer && hasChildren && controller.isExpanded(segments, depth)
  const nodeKey = pathKey(segments)
  const isCurrentMatch = controller.currentMatchKey === nodeKey
  const isMatch = controller.matchedPathKeys.has(nodeKey)
  const opening = nodeType === 'array' ? '[' : '{'
  const closing = nodeType === 'array' ? ']' : '}'
  const stringValue = typeof value === 'string' && value.length > 180 && /^[A-Za-z0-9]+$/.test(value)
    ? `${value.slice(0, 180)}...`
    : value
  const displayValue = nodeType === 'string' ? `"${stringValue}"` : String(value)

  useEffect(() => {
    if (isCurrentMatch) rowRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [isCurrentMatch])

  return (
    <div className="json-node" data-node-key={nodeKey} data-match={isMatch ? '' : undefined} data-current={isCurrentMatch ? '' : undefined}>
      <div
        ref={rowRef}
        className={`group flex cursor-default items-start gap-1 rounded-sm px-1 py-px font-mono text-[13px] leading-5 hover:bg-accent/50 ${isCurrentMatch ? 'ring-2 ring-primary/70 ring-inset' : ''}`}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
        onClick={() => hasChildren && controller.toggleExpanded(segments, depth)}
        onContextMenu={(event) => openContextMenu(event, { nodeKey, segments, value, isContainer, hasChildren })}
      >
        <span className={`json-node-toggle mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-sm bg-primary text-primary-foreground ${hasChildren ? '' : 'invisible'}`}>
          {expanded ? <ChevronDown size={12} strokeWidth={3} /> : <ChevronRight size={12} strokeWidth={3} />}
        </span>
        {keyName !== undefined && (
          <span className="text-json-key">
            <HighlightedText text={String(keyName)} query={controller.query} />
            <span className="text-muted-foreground">:</span>
          </span>
        )}
        {isContainer ? (
          <>
            <span className="text-muted-foreground">{opening}</span>
            {hasChildren && !expanded && <span className="ml-0.5 text-[12px] text-muted-foreground/70">{summary(value)}</span>}
            {(!hasChildren || !expanded) && <span className="text-muted-foreground">{closing}{!isLast && depth > 0 ? ',' : ''}</span>}
          </>
        ) : (
          <span className={`break-all ${nodeType === 'string' ? 'text-json-string' : ''} ${nodeType === 'number' ? 'text-json-number' : ''} ${nodeType === 'boolean' ? 'text-json-boolean' : ''} ${nodeType === 'null' ? 'text-json-null italic' : ''}`}>
            <HighlightedText text={displayValue} query={controller.query} />
            {!isLast && depth > 0 && <span className="text-muted-foreground">,</span>}
          </span>
        )}
      </div>
      {isContainer && hasChildren && expanded && (
        <div className="ml-[19px] mt-px border-l border-border/60">
          {entries.map(([entryKey, entryValue], index) => (
            <JsonNode
              key={String(entryKey)}
              value={entryValue}
              keyName={entryKey}
              segments={[...segments, entryKey]}
              depth={depth + 1}
              isLast={index === entries.length - 1}
              controller={controller}
              openContextMenu={openContextMenu}
            />
          ))}
        </div>
      )}
      {isContainer && hasChildren && expanded && (
        <div className="font-mono text-[13px] leading-5 text-muted-foreground" style={{ paddingLeft: `${depth * 16 + 4}px` }}>
          <span className="inline-block w-4" />{closing}{!isLast && depth > 0 ? ',' : ''}
        </div>
      )}
    </div>
  )
}

export function JsonTree({ value, hasValue = value !== null && value !== undefined, controller }: JsonTreeProps) {
  const [menu, setMenu] = useState<ContextMenuState | null>(null)
  const openContextMenu = (event: MouseEvent, context: Omit<ContextMenuState, 'x' | 'y'>) => {
    event.preventDefault()
    setMenu({ ...context, x: event.clientX, y: event.clientY })
  }
  const closeMenu = () => setMenu(null)

  return (
    <div className="font-mono" onClick={closeMenu}>
      {hasValue ? (
        <JsonNode value={value} segments={[]} depth={0} isLast controller={controller} openContextMenu={openContextMenu} />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-16 text-center text-muted-foreground">
          <p className="text-sm">输入 JSON 并点击「格式化」后，结果将在此展示。</p>
        </div>
      )}
      {menu && (
        <div
          className="fixed z-50 min-w-48 rounded-md border bg-popover p-1 text-sm text-popover-foreground shadow-lg"
          style={{ left: menu.x, top: menu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          <p className="truncate px-2 py-1 text-xs text-muted-foreground">{menu.nodeKey}</p>
          <button className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left hover:bg-accent" onClick={() => { void copyText(menu.nodeKey.replace(/^\$\./, '')); closeMenu() }}><Copy size={14} />复制属性路径</button>
          <button className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left hover:bg-accent" onClick={() => { void copyText(typeof menu.value === 'object' ? beautify(menu.value, Number(controller.indentSize)) : String(menu.value)); closeMenu() }}><FileJson size={14} />复制值</button>
          {menu.isContainer && <button className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left hover:bg-accent" onClick={() => { void copyText(beautify(menu.value, Number(controller.indentSize))); closeMenu() }}><FileJson size={14} />复制对象</button>}
          {menu.isContainer && menu.hasChildren && <>
            <hr className="my-1 border-border" />
            <button className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left hover:bg-accent" onClick={() => { setSubtreeExpansion(menu.value, menu.segments, true, controller); closeMenu() }}><FolderPlus size={14} />展开当前子树</button>
            <button className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left hover:bg-accent" onClick={() => { setSubtreeExpansion(menu.value, menu.segments, false, controller); closeMenu() }}><FolderMinus size={14} />收起当前子树</button>
          </>}
        </div>
      )}
    </div>
  )
}
