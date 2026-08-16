import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import App from '../App.vue'
import { routes } from '../router/routes'
import { branchingStudy } from '../test/fixtures'
import { createBundledRepository } from '../infrastructure/content/bundledStudyRepository'
import { provideRepository } from '../application/repositoryProvider'

async function settle() {
  for (let i = 0; i < 10; i++) {
    await flushPromises()
    await new Promise((resolve) => setTimeout(resolve, 0))
  }
  await flushPromises()
}

beforeEach(() => {
  localStorage.clear()
  provideRepository(createBundledRepository([branchingStudy('ruy-lopez')]))
})

describe('openings browser flow', () => {
  async function openBrowser() {
    const router = createRouter({ history: createMemoryHistory(), routes })
    const wrapper = mount(App, { global: { plugins: [createPinia(), router] } })
    await router.push('/openings')
    await router.isReady()
    await settle()
    return { wrapper, router }
  }

  it('renders grouped families with availability states', async () => {
    const { wrapper } = await openBrowser()
    expect(wrapper.find('[data-test="group-kings-pawn"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="group-sicilian"]').exists()).toBe(true)
    const ruy = wrapper.find('[data-test="opening-ruy-lopez"]')
    expect(ruy.exists()).toBe(true)
    expect(ruy.text()).toContain('Lesson')
    expect(wrapper.find('[data-test="opening-sicilian-najdorf"]').text()).toContain('Coming soon')
  })

  it('search finds the Nimzo-Larsen by alias and navigates to available lessons', async () => {
    const { wrapper, router } = await openBrowser()
    await wrapper.find('[data-test="openings-search"]').setValue('larsen')
    await settle()
    expect(wrapper.find('[data-test="hit-nimzo-larsen"]').exists()).toBe(true)

    await wrapper.find('[data-test="openings-search"]').setValue('spanish')
    await settle()
    const hit = wrapper.find('[data-test="hit-ruy-lopez"]')
    expect(hit.exists()).toBe(true)
    await hit.trigger('click')
    await settle()
    expect(router.currentRoute.value.path).toBe('/study/ruy-lopez')
  })
})
