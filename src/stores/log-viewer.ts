import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

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
  return Boolean(
    value &&
      typeof value === 'object' &&
      'url' in value &&
      typeof value.url === 'string',
  )
}

export function normalizeLogEntries(value: unknown): LogEntry[] {
  if (!Array.isArray(value)) {
    throw new Error('日志文件必须是一个 JSON 数组')
  }

  const usedIds = new Set<string>()

  return value.map((item, index) => {
    if (!isRawLogEntry(item)) {
      throw new Error(`第 ${index + 1} 条日志缺少 url 字段`)
    }

    const baseId = item.logId?.trim() || `log-${index + 1}`
    let id = baseId
    let suffix = 2
    while (usedIds.has(id)) id = `${baseId}-${suffix++}`
    usedIds.add(id)

    return {
      ...item,
      id,
      name: getEndpointName(item.url),
    }
  })
}

export const useLogViewerStore = defineStore('log-viewer', () => {
  // 日志通常包含业务或身份信息，仅在当前页面会话中保留。
  const groups = ref<LogFileGroup[]>([])
  const logs = computed(() => groups.value.flatMap((group) => group.logs))
  const activeId = ref<string | null>(null)
  const activeLog = computed(
    () => logs.value.find((log) => log.id === activeId.value) ?? null,
  )

  function createGroupId() {
    return `group-${Math.random().toString(36).slice(2, 10)}`
  }

  function addLogGroup(name: string, value: unknown) {
    const id = createGroupId()
    const group: LogFileGroup = {
      id,
      name: name.trim() || '未命名日志文件',
      logs: normalizeLogEntries(value).map((log) => ({
        ...log,
        id: `${id}:${log.id}`,
      })),
    }

    groups.value.push(group)
    if (!activeId.value) activeId.value = group.logs[0]?.id ?? null
    return group
  }

  function setLogs(value: unknown) {
    clearLogs()
    addLogGroup('未命名日志文件', value)
  }

  function setActive(id: string) {
    if (logs.value.some((log) => log.id === id)) activeId.value = id
  }

  function clearLogs() {
    groups.value = []
    activeId.value = null
  }

  return {
    groups,
    logs,
    activeId,
    activeLog,
    addLogGroup,
    setLogs,
    setActive,
    clearLogs,
  }
})
