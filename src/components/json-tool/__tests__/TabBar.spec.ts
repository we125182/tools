import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import TabBar from '../TabBar.vue'
import { useJsonStore } from '@/stores/json'

describe('TabBar', () => {
  it('creates and activates a blank tab from the add button', async () => {
    const pinia = createPinia()
    const store = useJsonStore(pinia)
    store.tabs = [{ id: 't1', name: 'Tab 1', input: '{"current":true}', query: '', sortMode: 'asc' }]
    store.activeId = 't1'

    const wrapper = mount(TabBar, {
      global: { plugins: [pinia] },
    })

    await wrapper.get('button[aria-label="新建空白 Tab"]').trigger('click')

    expect(wrapper.text()).not.toContain('复制当前 Tab')
    expect(store.tabs).toHaveLength(2)
    expect(store.activeInput).toBe('')
  })
})
