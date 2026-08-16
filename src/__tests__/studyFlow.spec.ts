import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory, type Router } from 'vue-router'
import App from '../App.vue'
import { routes } from '../router/routes'
import { branchingStudy } from '../test/fixtures'
import { createBundledRepository } from '../infrastructure/content/bundledStudyRepository'
import { createLocalRepository } from '../infrastructure/storage/localStudyRepository'
import { CompositeStudyRepository } from '../infrastructure/content/compositeStudyRepository'
import { provideRepository } from '../application/repositoryProvider'

/** Flush microtasks AND macrotasks (fake-indexeddb resolves on real timers). */
async function settle() {
  for (let i = 0; i < 10; i++) {
    await flushPromises()
    await new Promise((resolve) => setTimeout(resolve, 0))
  }
  await flushPromises()
}

async function makeApp(path: string): Promise<{ wrapper: ReturnType<typeof mount>; router: Router }> {
  const router = createRouter({ history: createMemoryHistory(), routes })
  const wrapper = mount(App, {
    global: { plugins: [createPinia(), router] },
    attachTo: document.body,
  })
  await router.push(path)
  await router.isReady()
  await settle()
  return { wrapper, router }
}

beforeEach(() => {
  localStorage.clear()
  provideRepository(
    new CompositeStudyRepository(
      createBundledRepository([branchingStudy()]),
      createLocalRepository(`test-db-${Math.random().toString(36).slice(2)}`),
    ),
  )
})

describe('library flow', () => {
  it('lists studies and opens one', async () => {
    const { wrapper, router } = await makeApp('/')
    expect(wrapper.text()).toContain('Italian Fixture')
    await wrapper.find('[data-test="study-card"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/study/fixture-italian')
  })

  it('filters by category', async () => {
    const { wrapper } = await makeApp('/')
    await wrapper.find('[data-test="filter-endgames"]').trigger('click')
    expect(wrapper.text()).not.toContain('Italian Fixture')
    await wrapper.find('[data-test="filter-all"]').trigger('click')
    expect(wrapper.text()).toContain('Italian Fixture')
  })
})

describe('study reader flow', () => {
  it('walks the core Next/Previous/jump/variation/flip loop', async () => {
    const { wrapper } = await makeApp('/study/fixture-italian')

    // board renders the start position
    expect(wrapper.findAll('image')).toHaveLength(32)
    expect(wrapper.text()).toContain('Italian Fixture')

    // Next → annotation appears
    await wrapper.find('[data-test="nav-next"]').trigger('click')
    expect(wrapper.text()).toContain('Claims the center.')
    expect(wrapper.text()).toContain('e4')

    // Previous → back to start
    await wrapper.find('[data-test="nav-previous"]').trigger('click')
    expect(wrapper.text()).not.toContain('Claims the center.')

    // keyboard Next
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    await flushPromises()
    expect(wrapper.text()).toContain('Claims the center.')

    // jump via the move list to 3. Bc4 (the branch point position)
    const bc4 = wrapper.findAll('[data-test="move"]').find((n) => n.text().includes('Bc4'))!
    await bc4.trigger('click')

    // variation offered and selectable
    const variation = wrapper.find('[data-test="variation-option"]')
    expect(variation.text()).toContain('Nf6')
    await variation.trigger('click')
    expect(wrapper.text()).toContain('The Two Knights.')

    // return to the main line
    await wrapper.find('[data-test="return-mainline"]').trigger('click')
    expect(wrapper.find('[data-test="return-mainline"]').exists()).toBe(false)

    // flip via button: rank labels reverse
    const firstRankLabel = () => wrapper.findAll('text.coord').at(8)!.text()
    const before = firstRankLabel()
    await wrapper.find('[data-test="flip-board"]').trigger('click')
    expect(firstRankLabel()).not.toBe(before)
  })

  it('shows a friendly error for a missing study', async () => {
    const { wrapper } = await makeApp('/study/does-not-exist')
    expect(wrapper.text()).toContain('Study not found.')
  })
})

describe('import flow', () => {
  it('imports a PGN and opens it as a study', async () => {
    const { wrapper, router } = await makeApp('/import')
    await wrapper
      .find('[data-test="pgn-input"]')
      .setValue('[White "A"]\n[Black "B"]\n\n1. d4 d5 2. c4 e6')
    await wrapper.find('[data-test="import-submit"]').trigger('click')
    await settle()
    expect(router.currentRoute.value.path).toMatch(/^\/study\//)
    expect(wrapper.text()).toContain('A vs B')
  })

  it('shows the friendly parse error for invalid PGN', async () => {
    const { wrapper } = await makeApp('/import')
    await wrapper.find('[data-test="pgn-input"]').setValue('this is not chess')
    await wrapper.find('[data-test="import-submit"]').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain("We couldn't parse this PGN.")
  })
})

describe('review fixes', () => {
  it('distinguishes a storage failure from a parse failure on import', async () => {
    provideRepository({
      list: async () => [],
      get: async () => null,
      save: async () => {
        throw new Error('quota exceeded')
      },
      delete: async () => {},
    })
    const { wrapper } = await makeApp('/import')
    await wrapper.find('[data-test="pgn-input"]').setValue('1. e4 e5 2. Nf3')
    await wrapper.find('[data-test="import-submit"]').trigger('click')
    await settle()
    expect(wrapper.text()).toContain("couldn't be saved")
    expect(wrapper.text()).not.toContain("couldn't parse")
  })

  it('returns to the main line with Escape', async () => {
    const { wrapper } = await makeApp('/study/fixture-italian')
    const bc4 = wrapper.findAll('[data-test="move"]').find((n) => n.text().includes('Bc4'))!
    await bc4.trigger('click')
    await wrapper.find('[data-test="variation-option"]').trigger('click')
    expect(wrapper.find('[data-test="return-mainline"]').exists()).toBe(true)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await flushPromises()
    expect(wrapper.find('[data-test="return-mainline"]').exists()).toBe(false)
  })
})

describe('featured study card', () => {
  it('shows a Start-here card when the featured study exists and opens it', async () => {
    const opera = branchingStudy('opera-game')
    opera.title = 'The Opera Game'
    provideRepository(
      new CompositeStudyRepository(
        createBundledRepository([opera, branchingStudy()]),
        createLocalRepository(`test-db-${Math.random().toString(36).slice(2)}`),
      ),
    )
    const { wrapper, router } = await makeApp('/')
    const card = wrapper.find('[data-test="featured-card"]')
    expect(card.text()).toContain('Start here')
    expect(card.text()).toContain('The Opera Game')
    await card.find('[data-test="featured-start"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/study/opera-game')
  })

  it('shows no featured card when the featured study is absent', async () => {
    const { wrapper } = await makeApp('/')
    expect(wrapper.find('[data-test="featured-card"]').exists()).toBe(false)
  })
})

describe('color focus badge', () => {
  it('shows which side a focused study teaches for', async () => {
    const caro = branchingStudy('caro-kann')
    caro.title = 'The Caro-Kann'
    caro.focus = 'black'
    provideRepository(
      new CompositeStudyRepository(
        createBundledRepository([caro, branchingStudy()]),
        createLocalRepository(`test-db-${Math.random().toString(36).slice(2)}`),
      ),
    )
    const { wrapper } = await makeApp('/')
    const cards = wrapper.findAll('[data-test="study-card"]')
    const caroCard = cards.find((c) => c.text().includes('Caro-Kann'))!
    expect(caroCard.find('[data-test="focus-badge"]').text()).toContain('Black')
    const plain = cards.find((c) => c.text().includes('Italian Fixture'))!
    expect(plain.find('[data-test="focus-badge"]').exists()).toBe(false)
  })
})
