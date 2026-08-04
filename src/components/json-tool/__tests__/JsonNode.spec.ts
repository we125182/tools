import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import JsonNode from '../JsonNode.vue'
import { useJsonStore } from '@/stores/json'

describe('JsonNode', () => {
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
})
