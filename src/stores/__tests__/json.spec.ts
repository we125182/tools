import { beforeEach, describe, expect, it } from 'vitest'
import { getActiveTab, useJsonStore } from '../json'

describe('JSON Zustand store', () => {
  beforeEach(() => {
    localStorage.clear()
    useJsonStore.getState().reset()
  })

  it('defaults new tabs to ascending key sorting', () => {
    expect(useJsonStore.getState().sortMode).toBe('asc')

    useJsonStore.getState().addTab()

    expect(useJsonStore.getState().sortMode).toBe('asc')
  })

  it('compresses JavaScript object input to compact JSON', () => {
    const store = useJsonStore.getState()
    store.setInput("{ name: 'Codex', tags: [1, 2,], }")
    store.compress()

    const next = useJsonStore.getState()
    expect(getActiveTab(next).input).toBe('{"name":"Codex","tags":[1,2]}')
    expect(next.errors).toEqual([])
    expect(next.parsed).toEqual({ name: 'Codex', tags: [1, 2] })
  })

  it('finds matching keys and primitive values without duplicates', () => {
    const store = useJsonStore.getState()
    store.setInput('{"releaseStatus":"status: ready","owner":"Codex"}')
    store.reparse()
    store.setQuery('status')

    const next = useJsonStore.getState()
    expect(next.results).toEqual([{ segments: ['releaseStatus'] }])
    expect(next.matchIndex).toBe(0)
  })

  it('persists search and sort state for each tab when switching', () => {
    const store = useJsonStore.getState()
    store.setInput('{"current":true}')
    store.reparse()
    store.setQuery('current')
    store.setSortMode('default')
    store.addTab()
    store.setInput("{ name: 'Codex' }")
    store.setQuery('codex')
    store.setSortMode('desc')
    const secondId = useJsonStore.getState().activeId
    store.setActive('t1')

    let next = useJsonStore.getState()
    expect(next.query).toBe('current')
    expect(next.sortMode).toBe('default')

    next.setActive(secondId)
    next = useJsonStore.getState()
    expect(next.query).toBe('codex')
    expect(next.sortMode).toBe('desc')
    expect(next.parsed).toEqual({ name: 'Codex' })
  })

  it('closes all tabs and keeps a fresh blank tab active', () => {
    const store = useJsonStore.getState()
    store.setInput('{"current":true}')
    store.setQuery('current')
    store.setSortMode('desc')
    store.addTab()
    store.setInput('{"second":true}')

    store.closeAllTabs()

    const next = useJsonStore.getState()
    expect(next.tabs).toHaveLength(1)
    expect(getActiveTab(next)).toMatchObject({ name: 'Tab 1', input: '', query: '', sortMode: 'asc' })
    expect(next.activeId).toBe(next.tabs[0]!.id)
    expect(next.hasParsed).toBe(false)
    expect(next.query).toBe('')
    expect(next.sortMode).toBe('asc')
    expect(JSON.parse(localStorage.getItem('jt:tabs') ?? '[]')).toEqual(next.tabs)
    expect(localStorage.getItem('jt:activeId')).toBe(next.activeId)
  })
})
