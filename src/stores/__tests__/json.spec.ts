import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useJsonStore } from '../json'

describe('JSON tree expansion', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('tracks whether there are visible expanded nodes', () => {
    const store = useJsonStore()
    store.parsed = { first: { second: { value: 1 } } }

    expect(store.hasExpandedNodes).toBe(true)

    store.collapseAll()
    expect(store.hasExpandedNodes).toBe(false)

    store.expandAll()
    expect(store.hasExpandedNodes).toBe(true)

    store.setExpanded([], false)
    expect(store.hasExpandedNodes).toBe(false)
  })

  it('defaults object key sorting to ascending order', () => {
    const store = useJsonStore()

    expect(store.sortMode).toBe('asc')
  })

  it('compresses JavaScript object input to compact JSON', () => {
    const store = useJsonStore()
    store.activeInput = "{ name: 'Codex', tags: [1, 2,], }"

    store.compress()

    expect(store.errors).toHaveLength(0)
    expect(store.activeInput).toBe('{"name":"Codex","tags":[1,2]}')
    expect(store.parsed).toEqual({ name: 'Codex', tags: [1, 2] })
  })

  it('matches query text in keys and primitive values without duplicates', () => {
    const store = useJsonStore()
    store.parsed = {
      releaseStatus: 'status: ready',
      owner: 'Codex',
    }
    store.query = 'status'
    store.runSearch()

    expect(store.matchCount).toBe(1)
    expect(store.results).toEqual([{ segments: ['releaseStatus'] }])
  })

  it('preserves expanded branches while searching', () => {
    const store = useJsonStore()
    store.parsed = {
      matching: 'find me',
      expandedBranch: { nested: { value: 1 } },
    }
    store.setExpanded(['expandedBranch'], true)
    store.setExpanded(['expandedBranch', 'nested'], true)
    store.query = 'find'

    store.runSearch()

    expect(store.isExpanded(['expandedBranch'], 1)).toBe(true)
    expect(store.isExpanded(['expandedBranch', 'nested'], 2)).toBe(true)
  })

  it('adds and activates a blank tab', () => {
    const store = useJsonStore()
    store.tabs = [{ id: 't1', name: 'Tab 1', input: '{"current":true}', query: '', sortMode: 'asc' }]
    store.activeId = 't1'
    store.parsed = { current: true }
    store.hasParsed = true

    store.addTab()

    expect(store.tabs).toHaveLength(2)
    expect(store.activeId).toBe(store.tabs[1]?.id)
    expect(store.activeInput).toBe('')
    expect(store.query).toBe('')
    expect(store.sortMode).toBe('asc')
    expect(store.parsed).toBeNull()
  })

  it('restores the target tab search and sort state on tab switch', () => {
    const store = useJsonStore()
    store.tabs = [
      { id: 't1', name: 'Tab 1', input: '{"current":true}', query: 'current', sortMode: 'asc' },
      { id: 't2', name: 'Tab 2', input: "{ name: 'Codex', items: [1, 2,], }", query: 'codex', sortMode: 'desc' },
    ]
    store.activeId = 't1'

    store.setActive('t2')

    expect(store.activeId).toBe('t2')
    expect(store.activeInput).toBe('{\n  "name": "Codex",\n  "items": [\n    1,\n    2\n  ]\n}')
    expect(store.parsed).toEqual({ name: 'Codex', items: [1, 2] })
    expect(store.query).toBe('codex')
    expect(store.sortMode).toBe('desc')
    expect(store.matchCount).toBe(1)

    store.setActive('t1')

    expect(store.query).toBe('current')
    expect(store.sortMode).toBe('asc')
    expect(store.matchCount).toBe(1)
  })

  it('clears the preview when switching to a blank tab', () => {
    const store = useJsonStore()
    store.tabs = [
      { id: 't1', name: 'Tab 1', input: '{"current":true}', query: '', sortMode: 'asc' },
      { id: 't2', name: 'Tab 2', input: '', query: 'saved search', sortMode: 'default' },
    ]
    store.activeId = 't1'
    store.parsed = { current: true }
    store.hasParsed = true

    store.setActive('t2')

    expect(store.parsed).toBeNull()
    expect(store.errors).toEqual([])
    expect(store.hasParsed).toBe(false)
  })
})
