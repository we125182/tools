import { beforeEach, describe, expect, it } from 'vitest'
import { getActiveLog, getLogs, normalizeLogEntries, useLogViewerStore } from '../log-viewer'

const fixture = [
  { logId: 'request-1', url: '/api/settle?source=kiosk', req: { amount: 94 }, res: { respCode: '000000' } },
  { logId: 'request-2', url: '/api/mark', req: { event: 'open' }, res: { respCode: '000000' } },
]

describe('log viewer Zustand store', () => {
  beforeEach(() => useLogViewerStore.getState().reset())

  it('uses the final URL path as the log name', () => {
    expect(normalizeLogEntries(fixture)[0]?.name).toBe('settle')
  })

  it('groups imported files and selects the first request', () => {
    const store = useLogViewerStore.getState()
    store.addLogGroup('first.log.json', fixture)
    store.addLogGroup('second.log.json', fixture.slice(1))

    const state = useLogViewerStore.getState()
    expect(state.groups.map((group) => group.name)).toEqual(['first.log.json', 'second.log.json'])
    expect(getLogs(state.groups)).toHaveLength(3)
    expect(getActiveLog(state.groups, state.activeId)?.name).toBe('settle')
  })

  it('rejects non-array log files', () => {
    expect(() => normalizeLogEntries({ logs: fixture })).toThrow('日志文件必须是一个 JSON 数组')
  })
})
