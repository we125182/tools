import { create } from 'zustand'
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

interface SearchState {
  results: SearchResult[]
  matchIndex: number
  expandMap: Map<string, boolean>
}

export interface JsonStore {
  tabs: Tab[]
  activeId: string
  parsed: unknown
  errors: JsonError[]
  hasParsed: boolean
  nodeCount: number
  expandMap: Map<string, boolean>
  indentSize: '2' | '4'
  query: string
  sortMode: SortMode
  results: SearchResult[]
  matchIndex: number
  setInput: (input: string) => void
  setActive: (id: string) => void
  addTab: () => void
  closeTab: (id: string) => void
  closeAllTabs: () => void
  duplicateTab: (id: string) => void
  renameTab: (id: string, name: string) => void
  reparse: () => void
  format: () => void
  compress: () => void
  clearInput: () => void
  setIndentSize: (indentSize: '2' | '4') => void
  setQuery: (query: string) => void
  setSortMode: (sortMode: SortMode) => void
  nextMatch: () => void
  prevMatch: () => void
  clearSearch: () => void
  setExpanded: (segments: PathSegment[], expanded: boolean) => void
  toggleExpanded: (segments: PathSegment[], depth: number) => void
  expandAll: () => void
  collapseAll: () => void
  reset: () => void
}

const LARGE_NODE_THRESHOLD = 2000
const storage = typeof window === 'undefined' ? undefined : window.localStorage

function uid(): string {
  return `t${Math.random().toString(36).slice(2, 10)}`
}

function createTab(id: string, name: string, input = ''): Tab {
  return { id, name, input, query: '', sortMode: 'asc' }
}

function normalizeTab(tab: Partial<Tab>): Tab {
  const sortMode: SortMode = ['default', 'asc', 'desc'].includes(tab.sortMode ?? '')
    ? tab.sortMode as SortMode
    : 'asc'
  return {
    id: tab.id ?? uid(),
    name: tab.name ?? 'Tab',
    input: tab.input ?? '',
    query: tab.query ?? '',
    sortMode,
  }
}

function readTabs(): Tab[] {
  try {
    const value = JSON.parse(storage?.getItem('jt:tabs') ?? 'null')
    return Array.isArray(value) && value.length ? value.map(normalizeTab) : [createTab('t1', 'Tab 1')]
  } catch {
    return [createTab('t1', 'Tab 1')]
  }
}

function readActiveId(tabs: Tab[]): string {
  const activeId = storage?.getItem('jt:activeId') ?? tabs[0]!.id
  return tabs.some((tab) => tab.id === activeId) ? activeId : tabs[0]!.id
}

function readIndent(): '2' | '4' {
  return storage?.getItem('jt:indent') === '4' ? '4' : '2'
}

function persist(tabs: Tab[], activeId: string, indentSize: '2' | '4') {
  try {
    storage?.setItem('jt:tabs', JSON.stringify(tabs))
    storage?.setItem('jt:activeId', activeId)
    storage?.setItem('jt:indent', indentSize)
  } catch {
    // Storage failures must not stop JSON editing.
  }
}

function activeTab(state: Pick<JsonStore, 'tabs' | 'activeId'>): Tab {
  return state.tabs.find((tab) => tab.id === state.activeId) ?? state.tabs[0]!
}

function findSearch(value: unknown, query: string, baseExpandMap: Map<string, boolean>, nodeCount: number): SearchState {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery || value === null || value === undefined) {
    return { results: [], matchIndex: -1, expandMap: baseExpandMap }
  }

  const results: SearchResult[] = []
  const ancestors = new Set<string>()
  const visit = (node: unknown, segments: PathSegment[]) => {
    const key = segments[segments.length - 1]
    const matchesKey = key !== undefined && String(key).toLowerCase().includes(normalizedQuery)
    const matchesValue = node !== null && typeof node !== 'object' && String(node).toLowerCase().includes(normalizedQuery)
    if (matchesKey || matchesValue) {
      results.push({ segments })
      for (let index = 1; index < segments.length; index++) ancestors.add(pathKey(segments.slice(0, index)))
    }
    if (Array.isArray(node)) node.forEach((item, index) => visit(item, [...segments, index]))
    else if (node && typeof node === 'object') Object.entries(node).forEach(([key, item]) => visit(item, [...segments, key]))
  }
  visit(value, [])

  const expandMap = new Map(baseExpandMap)
  ancestors.forEach((key) => expandMap.set(key, true))
  if (nodeCount > LARGE_NODE_THRESHOLD) {
    results.forEach(({ segments }) => {
      for (let index = 1; index <= segments.length; index++) expandMap.set(pathKey(segments.slice(0, index)), true)
    })
  }
  return { results, matchIndex: results.length ? 0 : -1, expandMap }
}

function walkContainers(value: unknown, callback: (segments: PathSegment[]) => void, segments: PathSegment[] = []) {
  if (Array.isArray(value)) {
    callback(segments)
    value.forEach((item, index) => walkContainers(item, callback, [...segments, index]))
  } else if (value && typeof value === 'object') {
    callback(segments)
    Object.entries(value).forEach(([key, item]) => walkContainers(item, callback, [...segments, key]))
  }
}

const initialTabs = readTabs()
const initialActiveId = readActiveId(initialTabs)

export const useJsonStore = create<JsonStore>((set, get) => ({
  tabs: initialTabs,
  activeId: initialActiveId,
  parsed: null,
  errors: [],
  hasParsed: false,
  nodeCount: 0,
  expandMap: new Map(),
  indentSize: readIndent(),
  query: initialTabs.find((tab) => tab.id === initialActiveId)?.query ?? '',
  sortMode: initialTabs.find((tab) => tab.id === initialActiveId)?.sortMode ?? 'asc',
  results: [],
  matchIndex: -1,

  setInput: (input) => {
    set((state) => {
      const tabs = state.tabs.map((tab) => tab.id === state.activeId ? { ...tab, input } : tab)
      persist(tabs, state.activeId, state.indentSize)
      return { tabs }
    })
  },
  setActive: (id) => {
    const state = get()
    if (id === state.activeId || !state.tabs.some((tab) => tab.id === id)) return
    const nextTab = state.tabs.find((tab) => tab.id === id)!
    set({
      activeId: id,
      query: nextTab.query,
      sortMode: nextTab.sortMode,
      parsed: null,
      errors: [],
      hasParsed: false,
      nodeCount: 0,
      results: [],
      matchIndex: -1,
      expandMap: new Map(),
    })
    persist(state.tabs, id, state.indentSize)
    if (nextTab.input.trim()) get().format()
  },
  addTab: () => {
    const state = get()
    const tab = createTab(uid(), `Tab ${state.tabs.length + 1}`)
    const tabs = [...state.tabs, tab]
    set({ tabs, activeId: tab.id, query: '', sortMode: 'asc', parsed: null, errors: [], hasParsed: false, nodeCount: 0, results: [], matchIndex: -1, expandMap: new Map() })
    persist(tabs, tab.id, state.indentSize)
  },
  closeTab: (id) => {
    const state = get()
    const index = state.tabs.findIndex((tab) => tab.id === id)
    if (index < 0) return
    let tabs = state.tabs.filter((tab) => tab.id !== id)
    if (!tabs.length) tabs = [createTab(uid(), 'Tab 1')]
    const activeId = state.activeId === id ? tabs[Math.max(0, index - 1)]!.id : state.activeId
    const nextTab = tabs.find((tab) => tab.id === activeId)!
    set({ tabs, activeId, query: nextTab.query, sortMode: nextTab.sortMode, parsed: null, errors: [], hasParsed: false, nodeCount: 0, results: [], matchIndex: -1, expandMap: new Map() })
    persist(tabs, activeId, state.indentSize)
    if (state.activeId === id && nextTab.input.trim()) get().format()
  },
  closeAllTabs: () => {
    const state = get()
    const tab = createTab(uid(), 'Tab 1')
    const tabs = [tab]
    set({ tabs, activeId: tab.id, query: '', sortMode: 'asc', parsed: null, errors: [], hasParsed: false, nodeCount: 0, results: [], matchIndex: -1, expandMap: new Map() })
    persist(tabs, tab.id, state.indentSize)
  },
  duplicateTab: (id) => {
    const state = get()
    const index = state.tabs.findIndex((tab) => tab.id === id)
    if (index < 0) return
    const source = state.tabs[index]!
    const tab = { ...source, id: uid(), name: `${source.name} copy` }
    const tabs = [...state.tabs.slice(0, index + 1), tab, ...state.tabs.slice(index + 1)]
    set({ tabs, activeId: tab.id, query: tab.query, sortMode: tab.sortMode, parsed: null, errors: [], hasParsed: false, nodeCount: 0, results: [], matchIndex: -1, expandMap: new Map() })
    persist(tabs, tab.id, state.indentSize)
    if (tab.input.trim()) get().format()
  },
  renameTab: (id, name) => set((state) => {
    const tabs = state.tabs.map((tab) => tab.id === id ? { ...tab, name } : tab)
    persist(tabs, state.activeId, state.indentSize)
    return { tabs }
  }),
  reparse: () => {
    const state = get()
    const input = activeTab(state).input
    if (!input.trim()) {
      set({ parsed: null, errors: [], hasParsed: false, nodeCount: 0, results: [], matchIndex: -1, expandMap: new Map() })
      return
    }
    const { value, errors } = validate(input)
    if (errors.length) {
      set({ parsed: null, errors, hasParsed: true, nodeCount: 0, results: [], matchIndex: -1 })
      return
    }
    const nodeCount = estimateNodeCount(value)
    const search = findSearch(value, state.query, state.expandMap, nodeCount)
    set({ parsed: value, errors: [], hasParsed: true, nodeCount, ...search })
  },
  format: () => {
    const state = get()
    const input = activeTab(state).input
    if (!input.trim()) {
      get().reparse()
      return
    }
    const { value, errors } = validate(input)
    if (errors.length) {
      set({ parsed: null, errors, hasParsed: true, nodeCount: 0, results: [], matchIndex: -1 })
      return
    }
    const inputValue = beautify(value, Number(state.indentSize))
    const tabs = state.tabs.map((tab) => tab.id === state.activeId ? { ...tab, input: inputValue } : tab)
    const nodeCount = estimateNodeCount(value)
    const search = findSearch(value, state.query, new Map(), nodeCount)
    set({ tabs, parsed: value, errors: [], hasParsed: true, nodeCount, ...search })
    persist(tabs, state.activeId, state.indentSize)
  },
  compress: () => {
    const state = get()
    const input = activeTab(state).input
    if (!input.trim()) {
      get().reparse()
      return
    }
    const { value, errors } = validate(input)
    if (errors.length) {
      set({ parsed: null, errors, hasParsed: true, nodeCount: 0, results: [], matchIndex: -1 })
      return
    }
    const inputValue = beautify(value, 0)
    const tabs = state.tabs.map((tab) => tab.id === state.activeId ? { ...tab, input: inputValue } : tab)
    const nodeCount = estimateNodeCount(value)
    const search = findSearch(value, state.query, new Map(), nodeCount)
    set({ tabs, parsed: value, errors: [], hasParsed: true, nodeCount, ...search })
    persist(tabs, state.activeId, state.indentSize)
  },
  clearInput: () => {
    const state = get()
    const tabs = state.tabs.map((tab) => tab.id === state.activeId ? { ...tab, input: '', query: '' } : tab)
    set({ tabs, query: '', parsed: null, errors: [], hasParsed: false, nodeCount: 0, results: [], matchIndex: -1, expandMap: new Map() })
    persist(tabs, state.activeId, state.indentSize)
  },
  setIndentSize: (indentSize) => {
    set({ indentSize })
    const state = get()
    persist(state.tabs, state.activeId, indentSize)
  },
  setQuery: (query) => {
    const state = get()
    const tabs = state.tabs.map((tab) => tab.id === state.activeId ? { ...tab, query } : tab)
    const search = findSearch(state.parsed, query, state.expandMap, state.nodeCount)
    set({ tabs, query, ...search })
    persist(tabs, state.activeId, state.indentSize)
  },
  setSortMode: (sortMode) => set((state) => {
    const tabs = state.tabs.map((tab) => tab.id === state.activeId ? { ...tab, sortMode } : tab)
    persist(tabs, state.activeId, state.indentSize)
    return { tabs, sortMode }
  }),
  nextMatch: () => set((state) => state.results.length ? { matchIndex: (state.matchIndex + 1) % state.results.length } : {}),
  prevMatch: () => set((state) => state.results.length ? { matchIndex: (state.matchIndex - 1 + state.results.length) % state.results.length } : {}),
  clearSearch: () => get().setQuery(''),
  setExpanded: (segments, expanded) => set((state) => {
    const expandMap = new Map(state.expandMap)
    expandMap.set(pathKey(segments), expanded)
    return { expandMap }
  }),
  toggleExpanded: (segments) => {
    const state = get()
    const key = pathKey(segments)
    const current = state.expandMap.get(key) ?? true
    get().setExpanded(segments, !current)
  },
  expandAll: () => set((state) => {
    const expandMap = new Map(state.expandMap)
    walkContainers(state.parsed, (segments) => expandMap.set(pathKey(segments), true))
    return { expandMap }
  }),
  collapseAll: () => set((state) => {
    const expandMap = new Map(state.expandMap)
    walkContainers(state.parsed, (segments) => expandMap.set(pathKey(segments), false))
    return { expandMap }
  }),
  reset: () => {
    const tabs = [createTab('t1', 'Tab 1')]
    set({ tabs, activeId: 't1', parsed: null, errors: [], hasParsed: false, nodeCount: 0, expandMap: new Map(), indentSize: '2', query: '', sortMode: 'asc', results: [], matchIndex: -1 })
    persist(tabs, 't1', '2')
  },
}))

export function getActiveTab(state: Pick<JsonStore, 'tabs' | 'activeId'>): Tab {
  return activeTab(state)
}

export function getMatchedPathKeys(results: SearchResult[]): Set<string> {
  return new Set(results.map((result) => pathKey(result.segments)))
}

export function isLargeData(nodeCount: number): boolean {
  return nodeCount > LARGE_NODE_THRESHOLD
}
