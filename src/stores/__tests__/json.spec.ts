import { beforeEach, describe, expect, it } from 'vitest'
import { getActiveTab, useJsonStore } from '../json'

describe('JSON Zustand store', () => {
  beforeEach(() => {
    localStorage.clear()
    useJsonStore.getState().reset()
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
})
