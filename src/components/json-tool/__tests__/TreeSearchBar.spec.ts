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

  it('switches the object key sort mode from the sort menu', async () => {
    const pinia = createPinia()
    const store = useJsonStore(pinia)
    store.parsed = { zebra: 1, apple: 2 }

    const wrapper = mount(TreeSearchBar, {
      global: {
        plugins: [pinia],
        stubs: {
          DropdownMenu: { template: '<div><slot /></div>' },
          DropdownMenuTrigger: { template: '<div><slot /></div>' },
          DropdownMenuContent: { template: '<div><slot /></div>' },
          DropdownMenuLabel: true,
          DropdownMenuItem: {
            emits: ['select'],
            template: '<button @click="$emit(\'select\')"><slot /></button>',
          },
          Tooltip: { template: '<div><slot /></div>' },
          TooltipTrigger: { template: '<div><slot /></div>' },
          TooltipContent: true,
        },
      },
    })

    expect(wrapper.get('button[aria-label="键名排序：升序"]').attributes('aria-label'))
      .toBe('键名排序：升序')

    await wrapper.findAll('button').find((button) => button.text() === '倒序')?.trigger('click')

    expect(store.sortMode).toBe('desc')
    expect(wrapper.get('button[aria-label="键名排序：倒序"]').attributes('aria-label'))
      .toBe('键名排序：倒序')
  })
})
