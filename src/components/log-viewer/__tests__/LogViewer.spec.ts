import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import LogViewer from '../LogViewer.vue'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useLogViewerStore } from '@/stores/log-viewer'

const { toastSuccess } = vi.hoisted(() => ({
  toastSuccess: vi.fn(),
}))

vi.mock('@/components/ui/sonner', () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn(), success: toastSuccess }),
}))

describe('LogViewer', () => {
  let pinia: Pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    toastSuccess.mockReset()
  })

  it('shows formatted request and response payloads side by side', async () => {
    const store = useLogViewerStore()
    store.addLogGroup('current-info.log.json', [
      {
        logId: 'log-1',
        url: '/api/settle',
        reqTime: '2026-08-07 18:30:00',
        duration: '120ms',
        req: { orderNo: 'order-1' },
        res: { respCode: '000000' },
      },
    ])

    const wrapper = mount({
      components: { LogViewer, TooltipProvider },
      template: '<TooltipProvider :delay-duration="0"><LogViewer /></TooltipProvider>',
    }, {
      global: {
        plugins: [pinia],
      },
    })

    expect(wrapper.get('[data-log-payload="request"]').text()).toContain('orderNo')
    expect(wrapper.get('[data-log-payload="response"]').text()).toContain('respCode')
    expect(wrapper.text()).toContain('请求耗时 120ms')
    expect(wrapper.text()).toContain('请求时间 2026-08-07 18:30:00')
    expect(wrapper.text()).not.toContain('Raw JSON')
    expect(wrapper.findAll('[data-log-payload]').map((panel) => panel.attributes('data-log-payload'))).toEqual([
      'request',
      'response',
    ])

    const groupToggle = wrapper.get('button[aria-label="收起 current-info.log.json"]')
    expect(groupToggle.attributes('aria-expanded')).toBe('true')
    expect(groupToggle.attributes('title')).toBeUndefined()
    const group = wrapper.get('[aria-label="current-info.log.json"]')
    expect(group.find('[role="tooltip"]').exists()).toBe(false)

    await groupToggle.trigger('pointermove', { pointerType: 'mouse' })
    await new Promise((resolve) => setTimeout(resolve, 0))
    await flushPromises()
    expect(document.body.querySelector('[role="tooltip"]')?.textContent).toBe('current-info.log.json')

    await groupToggle.trigger('click')
    expect(groupToggle.attributes('aria-expanded')).toBe('false')
    expect(wrapper.get('button[title="/api/settle"]').isVisible()).toBe(false)
  })

  it('imports a dropped log file into its own group', async () => {
    const wrapper = mount({
      components: { LogViewer, TooltipProvider },
      template: '<TooltipProvider><LogViewer /></TooltipProvider>',
    }, {
      global: {
        plugins: [pinia],
        stubs: { teleport: true },
      },
    })
    const dropZone = wrapper.get('div.relative.flex')
    const file = Object.assign(new File([''], 'dropped.log.json'), {
      text: async () => JSON.stringify([
        {
          url: '/api/dropped',
          req: { source: 'drag-and-drop' },
          res: { respCode: '000000' },
        },
      ]),
    })

    await dropZone.trigger('dragenter', { dataTransfer: { types: ['Files'] } })
    expect(wrapper.text()).toContain('释放以导入日志文件')

    await dropZone.trigger('drop', { dataTransfer: { files: [file] } })
    await flushPromises()

    expect(useLogViewerStore().groups[0]?.name).toBe('dropped.log.json')
    expect(wrapper.text()).toContain('dropped')
    expect(toastSuccess).toHaveBeenCalledWith('日志已导入', {
      title: '日志已导入',
      description: '已导入 1 个文件，共 1 条请求',
      position: 'top-right',
    })
  })
})
