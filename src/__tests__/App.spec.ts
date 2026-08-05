import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import App from '../App.vue'

describe('App', () => {
  it('shows JSON Tools as the default active feature and supports collapsing the navigation', async () => {
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
    const featureButton = wrapper.get('button[aria-current="page"]')
    const navigation = wrapper.get('[aria-label="功能列表"]')

    expect(featureButton.attributes('aria-label')).toBe('JSON Tools')
    expect(navigation.classes()).toContain('w-52')

    await wrapper.get('button[aria-label="收起功能导航"]').trigger('click')

    expect(navigation.classes()).toContain('w-14')
    expect(wrapper.find('button[aria-label="展开功能导航"]').exists()).toBe(true)
    expect(featureButton.text()).toBe('')
    expect(featureButton.attributes('title')).toBe('JSON Tools')
    expect(wrapper.get('[data-feature-tooltip]').text()).toBe('JSON Tools')
  })
})
