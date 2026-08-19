import { create } from 'zustand'

export interface RawLogEntry {
  logId?: string
  url: string
  reqTime?: string | number
  duration?: string | number
  req?: unknown
  res?: unknown
}

export interface LogEntry extends RawLogEntry {
  id: string
  name: string
}

export interface LogFileGroup {
  id: string
  name: string
  logs: LogEntry[]
}

export interface LogViewerStore {
  groups: LogFileGroup[]
  activeId: string | null
  addLogGroup: (name: string, value: unknown) => LogFileGroup
  removeLogGroup: (id: string) => void
  setLogs: (value: unknown) => void
  setActive: (id: string) => void
  clearLogs: () => void
  reset: () => void
}

function getEndpointName(url: string): string {
  const path = url.split(/[?#]/, 1)[0]?.replace(/\/+$/, '') ?? ''
  const segments = path.split('/').filter(Boolean)
  const segment = segments[segments.length - 1]
  if (!segment) return '未命名请求'
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

function isRawLogEntry(value: unknown): value is RawLogEntry {
  return Boolean(value && typeof value === 'object' && 'url' in value && typeof value.url === 'string')
}

export function normalizeLogEntries(value: unknown): LogEntry[] {
  if (!Array.isArray(value)) throw new Error('日志文件必须是一个 JSON 数组')
  const usedIds = new Set<string>()
  return value.map((item, index) => {
    if (!isRawLogEntry(item)) throw new Error(`第 ${index + 1} 条日志缺少 url 字段`)
    const baseId = item.logId?.trim() || `log-${index + 1}`
    let id = baseId
    let suffix = 2
    while (usedIds.has(id)) id = `${baseId}-${suffix++}`
    usedIds.add(id)
    return { ...item, id, name: getEndpointName(item.url) }
  })
}

function createGroupId() {
  return `group-${Math.random().toString(36).slice(2, 10)}`
}

export const useLogViewerStore = create<LogViewerStore>((set, get) => ({
  groups: [],
  activeId: null,
  addLogGroup: (name, value) => {
    const id = createGroupId()
    const group: LogFileGroup = {
      id,
      name: name.trim() || '未命名日志文件',
      logs: normalizeLogEntries(value).map((log) => ({ ...log, id: `${id}:${log.id}` })),
    }
    set((state) => ({
      groups: [...state.groups, group],
      activeId: state.activeId ?? group.logs[0]?.id ?? null,
    }))
    return group
  },
  removeLogGroup: (id) => set((state) => {
    const removedGroup = state.groups.find((group) => group.id === id)
    if (!removedGroup) return state
    const groups = state.groups.filter((group) => group.id !== id)
    const removedActiveLog = removedGroup.logs.some((log) => log.id === state.activeId)
    return {
      groups,
      activeId: removedActiveLog ? getLogs(groups)[0]?.id ?? null : state.activeId,
    }
  }),
  setLogs: (value) => {
    set({ groups: [], activeId: null })
    get().addLogGroup('未命名日志文件', value)
  },
  setActive: (id) => set((state) => ({
    activeId: state.groups.some((group) => group.logs.some((log) => log.id === id)) ? id : state.activeId,
  })),
  clearLogs: () => set({ groups: [], activeId: null }),
  reset: () => set({ groups: [], activeId: null }),
}))

export function getLogs(groups: LogFileGroup[]): LogEntry[] {
  return groups.flatMap((group) => group.logs)
}

export function getActiveLog(groups: LogFileGroup[], activeId: string | null): LogEntry | null {
  return getLogs(groups).find((log) => log.id === activeId) ?? null
}
