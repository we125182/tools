import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import App from '../App.vue'

describe('App', () => {
  it('shows JSON Tools as the default active feature', () => {
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia()],
        stubs: {
          teleport: true,
        },
      },
    })

    expect(wrapper.text()).toContain('JSON Tools')
    expect(wrapper.find('[aria-label="功能列表"]').exists()).toBe(true)
    expect(wrapper.get('button[aria-current="page"]').attributes('aria-label')).toBe('JSON Tools')
  })
})
