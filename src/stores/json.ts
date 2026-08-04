import { computed, markRaw, reactive, ref, shallowRef, watch } from 'vue'
import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import {
  beautify,
  estimateNodeCount,
  pathKey,
  validate,
  type JsonError,
  type PathSegment,
} from '@/lib/jsonc'

export type SortMode = 'default' | 'asc' | 'desc'

export interface Tab {
  id: string
  name: string
  input: string
  query: string
  sortMode: SortMode
}

export interface SearchResult {
  segments: PathSegment[]
}

const LARGE_NODE_THRESHOLD = 2000

function uid(): string {
  return 't' + Math.random().toString(36).slice(2, 10)
}

function createTab(id: string, name: string, input = ''): Tab {
  return { id, name, input, query: '', sortMode: 'asc' }
}

function normalizeTab(tab: Partial<Tab>): Tab {
  const sortMode: SortMode =
    tab.sortMode === 'default' || tab.sortMode === 'asc' || tab.sortMode === 'desc'
      ? tab.sortMode
      : 'asc'

  return {
    id: tab.id ?? uid(),
    name: tab.name ?? 'Tab',
    input: tab.input ?? '',
    query: tab.query ?? '',
    sortMode,
  }
}

export const useJsonStore = defineStore('json', () => {
  // ---------- 多 Tab ----------
  const tabs = useStorage<Tab[]>('jt:tabs', [
    createTab('t1', 'Tab 1'),
  ])
  const activeId = useStorage('jt:activeId', 't1')

  // 为旧版本地存储补齐搜索与排序字段。
  tabs.value = tabs.value.map((tab) => normalizeTab(tab))

  const activeTab = computed<Tab>(
    () => tabs.value.find((t) => t.id === activeId.value) ?? tabs.value[0]!,
  )
  const activeInput = computed({
    get: () => activeTab.value.input,
    set: (v: string) => {
      activeTab.value.input = v
    },
  })
  const query = computed({
    get: () => activeTab.value.query,
    set: (v: string) => {
      activeTab.value.query = v
    },
  })
  const sortMode = computed<SortMode>({
    get: () => activeTab.value.sortMode,
    set: (v) => {
      activeTab.value.sortMode = v
    },
  })

  // ---------- 解析结果 ----------
  // markRaw + shallowRef：避免 Vue 深度响应化大型 JSON 导致卡顿
  const parsed = shallowRef<unknown>(null)
  const errors = ref<JsonError[]>([])
  const hasParsed = ref(false)
  const nodeCount = ref(0)
  const isLargeData = computed(() => nodeCount.value > LARGE_NODE_THRESHOLD)

  // ---------- 折叠态 ----------
  // 仅记录「显式展开(true)/折叠(false)」的容器节点 pathKey。
  // 默认行为：深度 < defaultExpandDepth 时展开，否则折叠；显式值优先。
  const expandMap = reactive<Map<string, boolean>>(new Map())
  const baseDefaultDepth = ref(2)
  const defaultExpandDepth = computed(() =>
    isLargeData.value ? 1 : baseDefaultDepth.value,
  )

  // ---------- 工具态 ----------
  const indentSize = useStorage<'2' | '4'>('jt:indent', '2')

  // ---------- 搜索 ----------
  const results = ref<SearchResult[]>([])
  const matchIndex = ref(0)
  const matchCount = computed(() => results.value.length)
  const matchedPathKeys = computed(
    () => new Set(results.value.map((r) => pathKey(r.segments))),
  )

  // ---------- 折叠态计算 ----------
  function isExpanded(segments: PathSegment[], depth: number): boolean {
    const key = pathKey(segments)
    const explicit = expandMap.get(key)
    if (explicit !== undefined) return explicit
    return depth < defaultExpandDepth.value
  }

  const hasExpandedNodes = computed(() => {
    let hasExpanded = false

    const visit = (value: unknown, segments: PathSegment[], depth: number) => {
      const children = Array.isArray(value)
        ? value.map((item, index) => [index, item] as const)
        : value && typeof value === 'object'
          ? Object.entries(value)
          : []

      if (children.length === 0 || !isExpanded(segments, depth)) return

      hasExpanded = true
      for (const [key, child] of children) {
        visit(child, [...segments, key], depth + 1)
      }
    }

    visit(parsed.value, [], 0)
    return hasExpanded
  })

  function setExpanded(segments: PathSegment[], expanded: boolean) {
    expandMap.set(pathKey(segments), expanded)
  }

  function toggleExpanded(segments: PathSegment[], depth: number) {
    setExpanded(segments, !isExpanded(segments, depth))
  }

  function expandAll() {
    walkContainers((segments) => expandMap.set(pathKey(segments), true))
  }

  function collapseAll() {
    walkContainers((segments) => expandMap.set(pathKey(segments), false))
  }

  function collapseLevel(maxDepth: number) {
    walkContainers((segments, depth) =>
      expandMap.set(pathKey(segments), depth < maxDepth),
    )
  }

  function walkContainers(
    fn: (segments: PathSegment[], depth: number) => void,
  ) {
    const visit = (value: unknown, segments: PathSegment[], depth: number) => {
      if (Array.isArray(value)) {
        fn(segments, depth)
        value.forEach((item, i) => visit(item, [...segments, i], depth + 1))
      } else if (value && typeof value === 'object') {
        fn(segments, depth)
        for (const [k, v] of Object.entries(value)) {
          visit(v, [...segments, k], depth + 1)
        }
      }
    }
    visit(parsed.value, [], 0)
  }

  // ---------- Tab 操作 ----------
  function setActive(id: string) {
    if (id === activeId.value || !tabs.value.some((t) => t.id === id)) return

    activeId.value = id
    resetSearchResults()

    if (activeInput.value.trim()) {
      format()
    } else {
      resetParsedState()
    }
  }

  function addTab() {
    const n = tabs.value.length + 1
    const tab = createTab(uid(), `Tab ${n}`)
    tabs.value.push(tab)
    setActive(tab.id)
  }

  function closeTab(id: string) {
    const idx = tabs.value.findIndex((t) => t.id === id)
    if (idx === -1) return
    tabs.value.splice(idx, 1)
    if (tabs.value.length === 0) {
      const fresh = createTab(uid(), 'Tab 1')
      tabs.value.push(fresh)
      activeId.value = fresh.id
      resetParsedState()
    } else if (activeId.value === id) {
      setActive(tabs.value[Math.max(0, idx - 1)]!.id)
    }
  }

  function duplicateTab(id: string) {
    const src = tabs.value.find((t) => t.id === id)
    if (!src) return
    const idx = tabs.value.findIndex((t) => t.id === id)
    const copy: Tab = { ...src, id: uid(), name: `${src.name} copy` }
    tabs.value.splice(idx + 1, 0, copy)
    setActive(copy.id)
  }

  function renameTab(id: string, name: string) {
    const t = tabs.value.find((x) => x.id === id)
    if (t) t.name = name
  }

  // ---------- 解析 / 格式化 ----------
  function reparse() {
    const { value, errors: errs } = validate(activeInput.value)
    errors.value = errs
    if (errs.length === 0) {
      parsed.value = markRaw(value as object)
      nodeCount.value = estimateNodeCount(value as object)
      if (query.value.trim()) runSearch()
    } else {
      parsed.value = null
      nodeCount.value = 0
      resetSearchResults()
    }
    hasParsed.value = true
  }

  function formatWithIndent(indent: number) {
    const { value, errors: errs } = validate(activeInput.value)
    errors.value = errs
    if (errs.length === 0) {
      const beautified = beautify(value, indent)
      activeInput.value = beautified
      parsed.value = markRaw(JSON.parse(beautified) as object)
      nodeCount.value = estimateNodeCount(JSON.parse(beautified) as object)
      resetExpand()
      if (query.value.trim()) runSearch()
      hasParsed.value = true
    } else {
      parsed.value = null
      nodeCount.value = 0
      resetSearchResults()
      hasParsed.value = true
    }
  }

  /** 解析成功后以选定缩进格式化；失败时保留输入并展示错误。 */
  function format() {
    formatWithIndent(Number(indentSize.value))
  }

  /** 解析成功后压缩为单行规范 JSON。 */
  function compress() {
    formatWithIndent(0)
  }

  function clearInput() {
    activeInput.value = ''
    resetParsedState()
    clearSearch()
  }

  function resetParsedState() {
    parsed.value = null
    errors.value = []
    hasParsed.value = false
    nodeCount.value = 0
    resetExpand()
  }

  function resetExpand() {
    expandMap.clear()
  }

  // ---------- 搜索 ----------
  function runSearch() {
    const q = query.value.trim().toLowerCase()
    if (!q) {
      clearSearch()
      return
    }
    const found: SearchResult[] = []
    const ancestors = new Set<string>()

    const visit = (value: unknown, segments: PathSegment[]) => {
      const key = segments[segments.length - 1]
      const matchesKey = key !== undefined && String(key).toLowerCase().includes(q)
      const matchesValue =
        value !== null &&
        typeof value !== 'object' &&
        String(value).toLowerCase().includes(q)

      if (matchesKey || matchesValue) {
        found.push({ segments })
        for (let i = 1; i < segments.length; i++) {
          ancestors.add(pathKey(segments.slice(0, i)))
        }
      }

      if (Array.isArray(value)) {
        value.forEach((item, i) => visit(item, [...segments, i]))
      } else if (value && typeof value === 'object') {
        for (const [k, v] of Object.entries(value)) {
          visit(v, [...segments, k])
        }
      }
    }
    visit(parsed.value, [])

    results.value = found
    matchIndex.value = found.length ? 0 : -1

    // 保留用户现有的展开状态，并额外展开命中节点的祖先。
    if (!isLargeData.value) {
      for (const key of ancestors) expandMap.set(key, true)
    } else {
      // 大数据：展开全部命中祖先 + 命中自身
      for (const key of ancestors) expandMap.set(key, true)
      for (const r of found) {
        for (let i = 1; i <= r.segments.length; i++) {
          expandMap.set(pathKey(r.segments.slice(0, i)), true)
        }
      }
    }
  }

  function clearSearch() {
    query.value = ''
    resetSearchResults()
  }

  function resetSearchResults() {
    results.value = []
    matchIndex.value = -1
  }

  function nextMatch() {
    if (matchCount.value === 0) return
    matchIndex.value = (matchIndex.value + 1) % matchCount.value
  }

  function prevMatch() {
    if (matchCount.value === 0) return
    matchIndex.value =
      (matchIndex.value - 1 + matchCount.value) % matchCount.value
  }

  function currentMatchKey(): string | null {
    const r = results.value[matchIndex.value]
    return r ? pathKey(r.segments) : null
  }

  // query 变化时自动重新搜索（节流由组件层做防抖）
  watch(query, () => {
    if (!query.value.trim()) {
      resetSearchResults()
    } else if (parsed.value !== null) {
      runSearch()
    }
  })

  return {
    // tab
    tabs,
    activeId,
    activeTab,
    activeInput,
    setActive,
    addTab,
    closeTab,
    duplicateTab,
    renameTab,
    // parse
    parsed,
    errors,
    hasParsed,
    nodeCount,
    isLargeData,
    reparse,
    format,
    compress,
    clearInput,
    // expand
    expandMap,
    defaultExpandDepth,
    hasExpandedNodes,
    baseDefaultDepth,
    isExpanded,
    setExpanded,
    toggleExpanded,
    expandAll,
    collapseAll,
    collapseLevel,
    resetExpand,
    // tool
    indentSize,
    sortMode,
    // search
    query,
    results,
    matchIndex,
    matchCount,
    matchedPathKeys,
    runSearch,
    clearSearch,
    nextMatch,
    prevMatch,
    currentMatchKey,
  }
})
