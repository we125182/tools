import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import InputPanel from '../InputPanel.vue'
import { useJsonStore } from '@/stores/json'

describe('InputPanel', () => {
  it('compresses the active input when the compression button is clicked', async () => {
    const pinia = createPinia()
    const store = useJsonStore(pinia)
    store.activeInput = '{\n  "name": "Codex",\n  "items": [1, 2]\n}'

    const wrapper = mount(InputPanel, {
      global: {
        plugins: [pinia],
        stubs: { TabBar: true },
      },
    })

    await wrapper.get('button:nth-of-type(2)').trigger('click')

    expect(store.activeInput).toBe('{"name":"Codex","items":[1,2]}')
  })
})
