import { ChevronDown, ChevronRight, Clock3, FileJson, FileUp, Link, Trash2, Upload, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import { JsonTree, type JsonTreeController } from '@/components/json-tree/JsonTree'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { pathKey } from '@/lib/jsonc'
import { getActiveLog, getLogs, useLogViewerStore } from '@/stores/log-viewer'

function PayloadTree({ value }: { value: unknown }) {
  const [expandMap, setExpandMap] = useState<Map<string, boolean>>(() => new Map())
  const emptyMatches = useMemo(() => new Set<string>(), [])
  useEffect(() => setExpandMap(new Map()), [value])
  const controller = useMemo<JsonTreeController>(() => ({
    indentSize: '2',
    sortMode: 'asc',
    query: '',
    matchedPathKeys: emptyMatches,
    currentMatchKey: null,
    isExpanded: (segments) => expandMap.get(pathKey(segments)) ?? true,
    setExpanded: (segments, expanded) => setExpandMap((current) => new Map(current).set(pathKey(segments), expanded)),
    toggleExpanded: (segments) => setExpandMap((current) => {
      const next = new Map(current)
      const key = pathKey(segments)
      next.set(key, !(next.get(key) ?? true))
      return next
    }),
  }), [expandMap, emptyMatches])
  return <div className="min-h-0 flex-1 overflow-auto p-3"><JsonTree value={value} hasValue controller={controller} /></div>
}

function LogTabBar({ importFiles }: { importFiles: (files: File[]) => Promise<void> }) {
  const { groups, activeId, setActive, clearLogs } = useLogViewerStore()
  const [collapsedGroupIds, setCollapsedGroupIds] = useState<Set<string>>(() => new Set())
  const fileInput = useRef<HTMLInputElement>(null)
  const logs = getLogs(groups)
  const isExpanded = (id: string) => !collapsedGroupIds.has(id)
  const toggleGroup = (id: string) => setCollapsedGroupIds((current) => {
    const next = new Set(current)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })

  return (
    <aside className="flex h-full w-28 shrink-0 flex-col border-r bg-muted/30 p-2 sm:w-44" aria-label="请求日志">
      <div className="mb-2 flex h-8 items-center px-2"><span className="text-xs font-medium text-muted-foreground">请求日志</span><span className="ml-auto font-mono text-[11px] text-muted-foreground">{logs.length}</span></div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
        {groups.map((group) => (
          <section key={group.id} aria-label={group.name}>
            <button type="button" className="flex h-7 w-full min-w-0 items-center gap-1.5 rounded-sm px-2 text-left text-[11px] text-muted-foreground hover:bg-background/60 hover:text-foreground" aria-expanded={isExpanded(group.id)} aria-label={`${isExpanded(group.id) ? '收起' : '展开'} ${group.name}`} title={group.name} onClick={() => toggleGroup(group.id)}>{isExpanded(group.id) ? <ChevronDown size={12} /> : <ChevronRight size={12} />}<FileJson size={14} /><span className="min-w-0 flex-1 truncate">{group.name}</span><span className="font-mono">{group.logs.length}</span></button>
            {isExpanded(group.id) && <div className="space-y-1">{group.logs.map((log) => <button key={log.id} type="button" className={`flex h-9 w-full items-center rounded-md px-2 text-left text-xs ${activeId === log.id ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:bg-background/60 hover:text-foreground'}`} aria-current={activeId === log.id ? 'page' : undefined} title={log.url} onClick={() => setActive(log.id)}><span className="truncate">{log.name}</span></button>)}</div>}
          </section>
        ))}
        {!logs.length && <p className="px-2 py-4 text-xs leading-5 text-muted-foreground">暂无日志</p>}
      </div>
      <div className="mt-2 flex items-center gap-1 border-t pt-2">
        <Tooltip content="导入日志文件"><Button type="button" variant="ghost" size="icon" aria-label="导入日志文件" onClick={() => fileInput.current?.click()}><FileUp size={16} /></Button></Tooltip>
        <Tooltip content="清空日志"><Button type="button" variant="ghost" size="icon" aria-label="清空日志" disabled={!logs.length} onClick={clearLogs}><Trash2 size={16} /></Button></Tooltip>
        <input ref={fileInput} className="hidden" type="file" accept="application/json,.json,.log.json" multiple onChange={(event) => { const files = Array.from(event.target.files ?? []); event.target.value = ''; if (files.length) void importFiles(files) }} />
      </div>
    </aside>
  )
}

export function LogViewerPage() {
  const { groups, activeId, addLogGroup } = useLogViewerStore()
  const activeLog = getActiveLog(groups, activeId)
  const [isDraggingFiles, setIsDraggingFiles] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(null), 3000)
    return () => window.clearTimeout(timeout)
  }, [notice])
  const importFiles = async (files: File[]) => {
    let importedCount = 0
    const failures: string[] = []
    for (const file of files) {
      try {
        addLogGroup(file.name, JSON.parse(await file.text()) as unknown)
        importedCount++
      } catch (error) {
        failures.push(`${file.name}: ${error instanceof Error ? error.message : '文件内容无效'}`)
      }
    }
    const total = getLogs(useLogViewerStore.getState().groups).length
    if (failures.length) setNotice(`${importedCount ? `已导入 ${importedCount} 个文件。` : ''}${failures.join('；')}`)
    else if (importedCount) setNotice(`已导入 ${importedCount} 个文件，共 ${total} 条请求`)
  }
  const containsFiles = (event: DragEvent) => Array.from(event.dataTransfer.types).includes('Files')
  const duration = activeLog?.duration === undefined || activeLog?.duration === '' ? '耗时未知' : String(activeLog.duration)
  const requestTime = activeLog?.reqTime === undefined || activeLog?.reqTime === '' ? null : String(activeLog.reqTime)

  return (
    <main className="relative flex min-h-0 flex-1" onDragEnter={(event) => { event.preventDefault(); if (containsFiles(event)) setIsDraggingFiles(true) }} onDragOver={(event) => event.preventDefault()} onDragLeave={(event) => { if (event.currentTarget === event.target) setIsDraggingFiles(false) }} onDrop={(event) => { event.preventDefault(); setIsDraggingFiles(false); void importFiles(Array.from(event.dataTransfer.files)) }}>
      <LogTabBar importFiles={importFiles} />
      <section className="flex min-w-0 flex-1 flex-col">
        {activeLog ? <>
          <header className="flex min-h-14 shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b px-4 py-2"><div className="flex min-w-0 flex-1 items-center gap-2"><Link className="shrink-0 text-muted-foreground" size={16} /><span className="truncate font-mono text-sm" title={activeLog.url}>{activeLog.url}</span></div><span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground"><Clock3 size={14} />请求耗时 {duration}</span>{requestTime && <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground"><Clock3 size={14} />请求时间 {requestTime}</span>}</header>
          <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2"><section data-log-payload="request" className="flex min-h-0 flex-col border-b lg:border-r lg:border-b-0"><div className="shrink-0 border-b px-3 py-2 text-xs font-medium">请求参数</div><PayloadTree value={activeLog.req ?? null} /></section><section data-log-payload="response" className="flex min-h-0 flex-col"><div className="shrink-0 border-b px-3 py-2 text-xs font-medium">响应参数</div><PayloadTree value={activeLog.res ?? null} /></section></div>
        </> : <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-muted-foreground">导入日志文件后查看请求详情</div>}
      </section>
      {notice && <div role="status" className="fixed top-4 right-4 z-30 flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-md border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-lg"><span>{notice}</span><Button type="button" variant="ghost" size="icon-sm" className="shrink-0 text-muted-foreground" aria-label="关闭提示" onClick={() => setNotice(null)}><X size={14} /></Button></div>}
      {isDraggingFiles && <div className="absolute inset-0 z-20 flex items-center justify-center border-2 border-dashed border-primary bg-background/90"><div className="flex items-center gap-2 text-sm font-medium"><Upload size={20} />释放以导入日志文件</div></div>}
    </main>
  )
}
