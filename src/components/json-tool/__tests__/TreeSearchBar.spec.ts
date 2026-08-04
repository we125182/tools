import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import TreeSearchBar from '../TreeSearchBar.vue'
import { useJsonStore } from '@/stores/json'

describe('TreeSearchBar', () => {
  it('collapses a partially expanded nested tree on the first toggle', async () => {
    const pinia = createPinia()
    const store = useJsonStore(pinia)
    store.parsed = { first: { second: { value: 1 } } }

    const wrapper = mount(TreeSearchBar, {
      global: {
        plugins: [pinia],
        stubs: {
          Tooltip: { template: '<div><slot /></div>' },
          TooltipTrigger: { template: '<div><slot /></div>' },
          TooltipContent: true,
        },
      },
    })

    await wrapper.get('button[aria-label="收起全部"]').trigger('click')
    await nextTick()

    expect(store.hasExpandedNodes).toBe(false)
    expect(wrapper.find('button[aria-label="展开全部"]').exists()).toBe(true)
  })
})
