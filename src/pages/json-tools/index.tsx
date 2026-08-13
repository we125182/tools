import {
  ArrowDownAZ,
  ArrowUpAZ,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  ListFilter,
  Minimize2,
  Play,
  Plus,
  Search,
  Trash2,
  Wand2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { JsonTree, type JsonTreeController } from '@/components/json-tree/JsonTree'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { pathKey, type JsonError, type PathSegment } from '@/lib/jsonc'
import { getActiveTab, getMatchedPathKeys, isLargeData, type SortMode, useJsonStore } from '@/stores/json'

const SNIPPET_CONTEXT = 32
const sortModes = [
  { value: 'default', label: '默认排序', Icon: ListFilter },
  { value: 'asc', label: '按键名升序', Icon: ArrowDownAZ },
  { value: 'desc', label: '按键名降序', Icon: ArrowUpAZ },
] satisfies ReadonlyArray<{ value: SortMode; label: string; Icon: typeof ListFilter }>
const initialSortMode = sortModes[1]!

function getErrorSnippet(text: string, error: JsonError) {
  const lineStart = text.lastIndexOf('\n', Math.max(0, error.offset - 1)) + 1
  const nextLine = text.indexOf('\n', error.offset)
  const lineEnd = nextLine === -1 ? text.length : nextLine
  const line = text.slice(lineStart, lineEnd).replace(/\r$/, '')
  const errorIndex = Math.min(Math.max(error.offset - lineStart, 0), line.length)
  const start = Math.max(0, errorIndex - SNIPPET_CONTEXT)
  const end = Math.min(line.length, errorIndex + SNIPPET_CONTEXT + 1)
  return {
    prefix: `${start > 0 ? '...' : ''}${line.slice(start, errorIndex)}`,
    highlight: line.slice(errorIndex, errorIndex + 1),
    suffix: `${line.slice(errorIndex + 1, end)}${end < line.length ? '...' : ''}`,
  }
}

function hasExpandedNodes(value: unknown, expandMap: Map<string, boolean>, segments: PathSegment[] = [], depth = 0): boolean {
  const children = Array.isArray(value)
    ? value.map((item, index) => [index, item] as const)
    : value && typeof value === 'object'
      ? Object.entries(value)
      : []
  if (!children.length || !(expandMap.get(pathKey(segments)) ?? depth < Number.POSITIVE_INFINITY)) return false
  return true
}

function SortModeControl({ value, disabled, onValueChange }: {
  value: SortMode
  disabled: boolean
  onValueChange: (sortMode: SortMode) => void
}) {
  const activeMode = sortModes.find((mode) => mode.value === value) ?? initialSortMode
  const ActiveIcon = activeMode.Icon

  return (
    <div className="group relative size-8 shrink-0" aria-label="键名排序">
      <Tooltip content={activeMode.label}>
        <Button type="button" variant="outline" size="icon" aria-label="切换键名排序" disabled={disabled}>
          <ActiveIcon size={15} />
        </Button>
      </Tooltip>
      <div className="invisible absolute top-0 left-0 z-10 flex w-max rounded-md border bg-popover p-0.5 opacity-0 shadow-md transition-[opacity,visibility] group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        {sortModes.map((mode) => {
          const Icon = mode.Icon
          const selected = mode.value === value
          return (
            <Tooltip key={mode.value} content={mode.label}>
              <Button
                type="button"
                variant={selected ? 'secondary' : 'ghost'}
                size="icon-sm"
                aria-label={mode.label}
                aria-pressed={selected}
                disabled={disabled}
                onClick={() => onValueChange(mode.value)}
              >
                <Icon size={15} />
              </Button>
            </Tooltip>
          )
        })}
      </div>
    </div>
  )
}

export function JsonToolPage() {
  const store = useJsonStore()
  const activeTab = getActiveTab(store)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const reparseTimer = useRef<number | null>(null)
  const matchedPathKeys = useMemo(() => getMatchedPathKeys(store.results), [store.results])
  const currentMatchKey = store.results[store.matchIndex]
    ? pathKey(store.results[store.matchIndex]!.segments)
    : null
  const controller = useMemo<JsonTreeController>(() => ({
    indentSize: store.indentSize,
    sortMode: store.sortMode,
    query: store.query,
    matchedPathKeys,
    currentMatchKey,
    isExpanded: (segments) => store.expandMap.get(pathKey(segments)) ?? true,
    setExpanded: store.setExpanded,
    toggleExpanded: store.toggleExpanded,
  }), [store.indentSize, store.sortMode, store.query, matchedPathKeys, currentMatchKey, store.expandMap, store.setExpanded, store.toggleExpanded])

  useEffect(() => () => {
    if (reparseTimer.current !== null) window.clearTimeout(reparseTimer.current)
  }, [])

  const scheduleReparse = (input: string) => {
    store.setInput(input)
    if (reparseTimer.current !== null) window.clearTimeout(reparseTimer.current)
    reparseTimer.current = window.setTimeout(() => store.reparse(), 300)
  }
  const commitRename = () => {
    if (editingId) store.renameTab(editingId, editingName.trim() || 'Untitled')
    setEditingId(null)
  }
  const expanded = hasExpandedNodes(store.parsed, store.expandMap)
  const showTree = store.hasParsed && store.errors.length === 0

  return (
    <main className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2">
      <section className="flex min-h-0 min-w-0 flex-col border-r">
        <div className="flex h-full min-h-0">
          <aside className="flex h-full w-32 shrink-0 flex-col border-r bg-muted/30 p-2" aria-label="JSON 标签">
            <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
              {store.tabs.map((tab) => (
                <div
                  key={tab.id}
                  className={`group flex h-8 min-w-0 shrink-0 cursor-default items-center gap-1 rounded-md border px-2 text-xs transition-colors ${store.activeId === tab.id ? 'border-border bg-background text-foreground shadow-xs' : 'border-transparent text-muted-foreground hover:bg-background/60 hover:text-foreground'}`}
                  onClick={() => store.setActive(tab.id)}
                >
                  {editingId === tab.id ? (
                    <input
                      autoFocus
                      className="min-w-0 flex-1 rounded border bg-background px-1 py-0.5 text-xs outline-none focus:border-ring"
                      value={editingName}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) => setEditingName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') commitRename()
                        if (event.key === 'Escape') setEditingId(null)
                      }}
                      onBlur={commitRename}
                    />
                  ) : (
                    <>
                      <span className="min-w-0 flex-1 truncate" onDoubleClick={(event) => { event.stopPropagation(); setEditingId(tab.id); setEditingName(tab.name) }}>{tab.name}</span>
                      <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100" aria-label={`关闭 ${tab.name}`} onClick={(event) => { event.stopPropagation(); store.closeTab(tab.id) }}><X size={12} /></Button>
                    </>
                  )}
                </div>
              ))}
              <Button type="button" variant="secondary" size="icon" className="w-full text-muted-foreground" aria-label="新建空白 Tab" onClick={store.addTab}><Plus size={16} /></Button>
            </div>
          </aside>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center gap-2 border-b px-3 py-2">
              <Button type="button" size="sm" className="px-2 sm:px-3" aria-label="格式化" onClick={store.format}><Wand2 size={15} /><span className="hidden sm:inline">格式化</span></Button>
              <Button type="button" variant="outline" size="sm" className="px-2 sm:px-3" aria-label="压缩" onClick={store.compress}><Minimize2 size={15} /><span className="hidden sm:inline">压缩</span></Button>
              <Button type="button" variant="outline" size="sm" className="px-2 sm:px-3" aria-label="校验" onClick={store.reparse}><Play size={15} /><span className="hidden sm:inline">校验</span></Button>
              <Button type="button" variant="ghost" size="icon" className="text-muted-foreground" aria-label="清空" onClick={store.clearInput}><Trash2 size={15} /></Button>
              <span className="ml-auto hidden font-mono text-[11px] text-muted-foreground sm:inline">{activeTab.input.length} 字符</span>
            </div>
            <textarea
              value={activeTab.input}
              onChange={(event) => scheduleReparse(event.target.value)}
              placeholder='{ "hello": "world", "items": [1, 2, 3] }'
              spellCheck={false}
              className="h-full min-h-0 w-full flex-1 resize-none border-0 p-3 font-mono text-[13px] leading-5 outline-none"
            />
          </div>
        </div>
      </section>

      <section className="hidden min-h-0 min-w-0 flex-col lg:flex">
        {store.errors.length > 0 ? (
          <div className="flex min-h-0 flex-1 flex-col" aria-live="polite">
            <div className="flex items-start gap-3 border-b bg-destructive/10 px-4 py-3 text-destructive"><CircleAlert className="mt-0.5 shrink-0" size={16} /><div><h2 className="text-sm font-medium">JSON 校验失败</h2><p className="mt-0.5 text-xs text-muted-foreground">发现 {store.errors.length} 个错误，请在左侧修正后重新校验。</p></div></div>
            <ol className="min-h-0 flex-1 divide-y overflow-auto">
              {store.errors.map((error) => {
                const snippet = getErrorSnippet(activeTab.input, error)
                return <li className="flex items-start gap-3 px-4 py-3" key={`${error.offset}-${error.message}`}><span className="shrink-0 rounded-md bg-destructive px-2 py-0.5 font-mono text-xs text-destructive-foreground">{error.line}:{error.column}</span><div className="min-w-0 flex-1"><pre className="overflow-hidden rounded-sm bg-muted px-2 py-1 font-mono text-xs leading-5 whitespace-pre-wrap break-all"><code>{snippet.prefix}{snippet.highlight ? <mark className="rounded-sm bg-destructive px-px font-semibold text-destructive-foreground">{snippet.highlight}</mark> : <span className="inline-block h-4 w-0.5 bg-destructive align-text-bottom" />}{snippet.suffix}</code></pre><p className="mt-1 text-xs text-muted-foreground">{error.message}</p></div></li>
              })}
            </ol>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 border-b p-2">
              <Button type="button" variant="outline" size="sm" aria-label={expanded ? '收起全部' : '展开全部'} disabled={!showTree} onClick={expanded ? store.collapseAll : store.expandAll}>{expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}{expanded ? '收起全部' : '展开全部'}</Button>
              <SortModeControl value={store.sortMode} disabled={!showTree} onValueChange={store.setSortMode} />
              <div className="relative min-w-36 flex-1"><Search className="pointer-events-none absolute top-2 left-2.5 text-muted-foreground" size={14} /><input value={store.query} disabled={!showTree} onChange={(event) => store.setQuery(event.target.value)} placeholder="搜索文本..." className="h-8 w-full rounded-md border bg-background pl-8 pr-8 text-xs outline-none focus:border-ring disabled:opacity-50" />{store.query && <Button type="button" variant="ghost" size="icon-sm" className="absolute top-1 right-1 text-muted-foreground" aria-label="清除搜索" onClick={store.clearSearch}><X size={14} /></Button>}</div>
              {store.query && <div className="flex items-center gap-1"><span className="rounded-md bg-secondary px-2 py-1.5 font-mono text-xs">{store.results.length ? `${store.matchIndex + 1}/${store.results.length}` : '无匹配'}</span><Button type="button" variant="ghost" size="icon" aria-label="上一个" disabled={!store.results.length} onClick={store.prevMatch}><ChevronUp size={15} /></Button><Button type="button" variant="ghost" size="icon" aria-label="下一个" disabled={!store.results.length} onClick={store.nextMatch}><ChevronDown size={15} /></Button></div>}
            </div>
            {isLargeData(store.nodeCount) && <div className="border-b bg-amber-500/10 px-3 py-1.5 text-xs text-amber-700 dark:text-amber-400">数据较大（{store.nodeCount} 节点），大量展开节点可能影响滚动流畅度。</div>}
            <div className="min-h-0 flex-1 overflow-auto p-3"><JsonTree value={store.parsed} hasValue={showTree} controller={controller} /></div>
            {store.hasParsed && <div className="flex items-center border-t px-3 py-1 text-[11px] text-muted-foreground"><span>右键节点可复制路径、值或对象</span><span className="ml-auto rounded-md border px-2 py-0.5">{store.nodeCount} 节点</span></div>}
          </>
        )}
      </section>
    </main>
  )
}
