import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import JsonNode from '../JsonNode.vue'
import { useJsonStore } from '@/stores/json'

const { copy } = vi.hoisted(() => ({ copy: vi.fn() }))

vi.mock('@vueuse/core', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@vueuse/core')>()),
  useClipboard: () => ({ copy }),
}))

describe('JsonNode', () => {
  beforeEach(() => {
    copy.mockClear()
  })

  it('highlights matching text in both the key and primitive value', () => {
    const pinia = createPinia()
    const store = useJsonStore(pinia)
    store.parsed = { status: 'not started' }
    store.query = 'sta'
    store.runSearch()

    const wrapper = mount(JsonNode, {
      props: {
        value: 'not started',
        keyName: 'status',
        segments: ['status'],
        depth: 1,
        isLast: true,
      },
      global: {
        plugins: [pinia],
        stubs: {
          ContextMenu: { template: '<div><slot /></div>' },
          ContextMenuTrigger: { template: '<div><slot /></div>' },
          ContextMenuContent: true,
        },
      },
    })

    expect(wrapper.findAll('mark').map((mark) => mark.text())).toEqual(['sta', 'sta'])
  })

  it('renders collapsed container summaries without nested brackets', () => {
    const pinia = createPinia()
    const store = useJsonStore(pinia)
    store.setExpanded(['data'], false)

    const wrapper = mount(JsonNode, {
      props: {
        value: { first: 1, second: 2 },
        keyName: 'data',
        segments: ['data'],
        depth: 2,
        isLast: true,
      },
      global: {
        plugins: [pinia],
        stubs: {
          ContextMenu: { template: '<div><slot /></div>' },
          ContextMenuTrigger: { template: '<div><slot /></div>' },
          ContextMenuContent: true,
        },
      },
    })

    expect(wrapper.text()).toContain('data:{…2 keys}')
    expect(wrapper.text()).not.toContain('data:{{')
  })

  it('renders a comma after an expanded container closing bracket only', () => {
    const pinia = createPinia()
    const store = useJsonStore(pinia)
    store.sortMode = 'default'

    const wrapper = mount(JsonNode, {
      props: {
        value: { nested: { value: 1 }, sibling: 2 },
        segments: [],
        depth: 0,
        isLast: true,
      },
      global: {
        plugins: [pinia],
        stubs: {
          ContextMenu: { template: '<div><slot /></div>' },
          ContextMenuTrigger: { template: '<div><slot /></div>' },
          ContextMenuContent: true,
        },
      },
    })

    const nestedNode = wrapper.find('[data-node-key="$.nested"]')

    expect(nestedNode.find('.group').text()).toBe('nested:{')
    expect(nestedNode.find('div.font-mono.text-muted-foreground').text()).toBe('},')
  })

  it('keeps primitive value commas within the wrapping text container', () => {
    const pinia = createPinia()
    const wrapper = mount(JsonNode, {
      props: {
        value: 'a long value that may wrap in a narrow panel',
        keyName: 'message',
        segments: ['message'],
        depth: 1,
        isLast: false,
      },
      global: {
        plugins: [pinia],
        stubs: {
          ContextMenu: { template: '<div><slot /></div>' },
          ContextMenuTrigger: { template: '<div><slot /></div>' },
          ContextMenuContent: true,
        },
      },
    })

    const value = wrapper.find('.break-all')

    expect(value.text()).toBe('"a long value that may wrap in a narrow panel",')
    expect(value.find('span.text-muted-foreground').text()).toBe(',')
  })

  it('truncates alphanumeric string values after 180 characters only', () => {
    const pinia = createPinia()
    const longValue = 'a'.repeat(181)
    const wrapper = mount(JsonNode, {
      props: {
        value: longValue,
        keyName: 'token',
        segments: ['token'],
        depth: 1,
        isLast: true,
      },
      global: {
        plugins: [pinia],
        stubs: {
          ContextMenu: { template: '<div><slot /></div>' },
          ContextMenuTrigger: { template: '<div><slot /></div>' },
          ContextMenuContent: true,
        },
      },
    })

    expect(wrapper.find('.break-all').text()).toBe(`"${'a'.repeat(180)}…"`)
  })

  it('does not truncate string values containing non-alphanumeric characters', () => {
    const pinia = createPinia()
    const longValue = `${'a'.repeat(180)}-`
    const wrapper = mount(JsonNode, {
      props: {
        value: longValue,
        keyName: 'token',
        segments: ['token'],
        depth: 1,
        isLast: true,
      },
      global: {
        plugins: [pinia],
        stubs: {
          ContextMenu: { template: '<div><slot /></div>' },
          ContextMenuTrigger: { template: '<div><slot /></div>' },
          ContextMenuContent: true,
        },
      },
    })

    expect(wrapper.find('.break-all').text()).toBe(`"${longValue}"`)
  })

  it('copies the complete value of a truncated string', async () => {
    const pinia = createPinia()
    const longValue = 'a'.repeat(181)
    const wrapper = mount(JsonNode, {
      props: {
        value: longValue,
        keyName: 'token',
        segments: ['token'],
        depth: 1,
        isLast: true,
      },
      global: {
        plugins: [pinia],
        stubs: {
          ContextMenu: { template: '<div><slot /></div>' },
          ContextMenuTrigger: { template: '<div><slot /></div>' },
          ContextMenuContent: { template: '<div><slot /></div>' },
          ContextMenuItem: {
            template: '<button @click="$emit(\'select\')"><slot /></button>',
          },
        },
      },
    })

    await wrapper.findAll('button')[1]!.trigger('click')

    expect(copy).toHaveBeenCalledWith(longValue)
  })

  it('sorts object keys without changing array index order', async () => {
    const pinia = createPinia()
    const store = useJsonStore(pinia)
    store.sortMode = 'asc'

    const objectWrapper = mount(JsonNode, {
      props: {
        value: { zebra: 1, apple: 2 },
        segments: [],
        depth: 0,
        isLast: true,
      },
      global: {
        plugins: [pinia],
        stubs: {
          ContextMenu: { template: '<div><slot /></div>' },
          ContextMenuTrigger: { template: '<div><slot /></div>' },
          ContextMenuContent: true,
        },
      },
    })

    expect(objectWrapper.findAll('[data-node-key]').map((node) => node.attributes('data-node-key')))
      .toEqual(['$', '$.apple', '$.zebra'])

    store.sortMode = 'desc'
    await nextTick()

    expect(objectWrapper.findAll('[data-node-key]').map((node) => node.attributes('data-node-key')))
      .toEqual(['$', '$.zebra', '$.apple'])

    const arrayWrapper = mount(JsonNode, {
      props: {
        value: ['zebra', 'apple'],
        segments: [],
        depth: 0,
        isLast: true,
      },
      global: {
        plugins: [pinia],
        stubs: {
          ContextMenu: { template: '<div><slot /></div>' },
          ContextMenuTrigger: { template: '<div><slot /></div>' },
          ContextMenuContent: true,
        },
      },
    })

    expect(arrayWrapper.findAll('[data-node-key]').map((node) => node.attributes('data-node-key')))
      .toEqual(['$', '$[0]', '$[1]'])
  })
})
