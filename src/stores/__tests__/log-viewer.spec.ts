import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { normalizeLogEntries, useLogViewerStore } from '../log-viewer'

const fixture = [
  {
    logId: 'request-1',
    url: '/yyds/tmnl/api/tmnl/setl/settle?source=kiosk',
    reqTime: '2026-08-05 12:35:44',
    duration: '13789ms',
    req: { bizNo: 'b-1', amount: 94 },
    res: { respCode: '000000', respMsg: '成功' },
  },
  {
    logId: 'request-2',
    url: '/yyds/tmnl/buriedPoint/mark',
    duration: '14ms',
    req: { retCode: '999999' },
    res: { respCode: '000000' },
  },
]

describe('log viewer store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('uses the final URL path as the tab name', () => {
    const [log] = normalizeLogEntries(fixture)

    expect(log?.name).toBe('settle')
    expect(log?.reqTime).toBe('2026-08-05 12:35:44')
    expect(log?.duration).toBe('13789ms')
  })

  it('groups logs by imported file and selects the first request', () => {
    const store = useLogViewerStore()

    store.addLogGroup('第一批.log.json', fixture)
    store.addLogGroup('第二批.log.json', fixture.slice(1))

    expect(store.groups.map((group) => group.name)).toEqual([
      '第一批.log.json',
      '第二批.log.json',
    ])
    expect(store.logs).toHaveLength(3)
    expect(store.activeLog?.name).toBe('settle')

    store.setActive(store.groups[1]!.logs[0]!.id)
    expect(store.activeLog?.name).toBe('mark')
  })

  it('rejects a file that is not a log array', () => {
    expect(() => normalizeLogEntries({ logs: fixture })).toThrow('日志文件必须是一个 JSON 数组')
  })
})
