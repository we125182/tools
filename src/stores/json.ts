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

export interface Tab {
  id: string
  name: string
  input: string
}

export type SearchMode = 'value' | 'path'

export interface SearchResult {
  segments: PathSegment[]
}

const LARGE_NODE_THRESHOLD = 2000

function uid(): string {
  return 't' + Math.random().toString(36).slice(2, 10)
}

export const useJsonStore = defineStore('json', () => {
  // ---------- 多 Tab ----------
  const tabs = useStorage<Tab[]>('jt:tabs', [
    { id: 't1', name: 'Tab 1', input: '' },
  ])
  const activeId = useStorage('jt:activeId', 't1')

  const activeTab = computed<Tab>(
    () => tabs.value.find((t) => t.id === activeId.value) ?? tabs.value[0]!,
  )
  const activeInput = computed({
    get: () => activeTab.value.input,
    set: (v: string) => {
      activeTab.value.input = v
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
  const query = ref('')
  const searchMode = ref<SearchMode>('value')
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
    if (tabs.value.some((t) => t.id === id)) activeId.value = id
  }

  function addTab() {
    const n = tabs.value.length + 1
    const tab: Tab = { id: uid(), name: `Tab ${n}`, input: '' }
    tabs.value.push(tab)
    activeId.value = tab.id
  }

  function closeTab(id: string) {
    const idx = tabs.value.findIndex((t) => t.id === id)
    if (idx === -1) return
    tabs.value.splice(idx, 1)
    if (tabs.value.length === 0) {
      const fresh: Tab = { id: uid(), name: 'Tab 1', input: '' }
      tabs.value.push(fresh)
      activeId.value = fresh.id
    } else if (activeId.value === id) {
      activeId.value = tabs.value[Math.max(0, idx - 1)]!.id
    }
  }

  function duplicateTab(id: string) {
    const src = tabs.value.find((t) => t.id === id)
    if (!src) return
    const idx = tabs.value.findIndex((t) => t.id === id)
    const copy: Tab = { id: uid(), name: `${src.name} copy`, input: src.input }
    tabs.value.splice(idx + 1, 0, copy)
    activeId.value = copy.id
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
    } else {
      parsed.value = null
      nodeCount.value = 0
    }
    hasParsed.value = true
  }

  /**
   * 校验 + 格式化：解析成功则把缩进规范后的文本写回输入框并生成树；
   * 解析失败则记录错误、不修改输入框。
   */
  function format() {
    const { value, errors: errs } = validate(activeInput.value)
    errors.value = errs
    if (errs.length === 0) {
      const beautified = beautify(value, Number(indentSize.value))
      activeInput.value = beautified
      parsed.value = markRaw(JSON.parse(beautified) as object)
      nodeCount.value = estimateNodeCount(JSON.parse(beautified) as object)
      resetExpand()
      hasParsed.value = true
    } else {
      parsed.value = null
      nodeCount.value = 0
      hasParsed.value = true
    }
  }

  function clearInput() {
    activeInput.value = ''
    parsed.value = null
    errors.value = []
    hasParsed.value = false
    nodeCount.value = 0
    resetExpand()
    clearSearch()
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
      // 路径匹配：检查最后一段 key/索引
      if (searchMode.value === 'path') {
        const last = segments[segments.length - 1]
        if (last !== undefined && String(last).toLowerCase().includes(q)) {
          found.push({ segments })
          for (let i = 1; i < segments.length; i++) {
            ancestors.add(pathKey(segments.slice(0, i)))
          }
        }
      } else if (
        value !== null &&
        typeof value !== 'object'
      ) {
        // 值匹配：仅原始值
        if (String(value).toLowerCase().includes(q)) {
          found.push({ segments })
          for (let i = 1; i < segments.length; i++) {
            ancestors.add(pathKey(segments.slice(0, i)))
          }
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

    // 自动展开命中节点的所有祖先
    expandMap.clear()
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

  // query / mode 变化时自动重新搜索（节流由组件层做防抖）
  watch([query, searchMode], () => {
    if (parsed.value !== null) runSearch()
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
    clearInput,
    // expand
    expandMap,
    defaultExpandDepth,
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
    // search
    query,
    searchMode,
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
