import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { branchingStudy } from '../../../test/fixtures'
import { createBundledRepository } from '../../../infrastructure/content/bundledStudyRepository'
import { provideRepository } from '../../repositoryProvider'
import { useOpeningsStore } from '../openingsStore'

/** The store runs against the real catalog; the repository decides which
 *  lessons count as available. */
beforeEach(() => {
  setActivePinia(createPinia())
  provideRepository(createBundledRepository([branchingStudy('ruy-lopez')]))
})

describe('openingsStore', () => {
  it('groups families for navigation', async () => {
    const store = useOpeningsStore()
    await store.load()
    const groups = store.grouped
    expect(groups.map((g) => g.id)).toContain('kings-pawn')
    expect(groups.map((g) => g.id)).toContain('sicilian')
    const kp = groups.find((g) => g.id === 'kings-pawn')!
    expect(kp.families.map((f) => f.id)).toContain('ruy-lopez')
    expect(kp.families.map((f) => f.id)).toContain('italian-game')
  })

  it('marks lesson availability from the repository', async () => {
    const store = useOpeningsStore()
    await store.load()
    expect(store.nodeById('ruy-lopez')!.lessonStatus).toBe('available')
    expect(store.nodeById('sicilian-najdorf')!.lessonStatus).toBe('planned')
  })

  it('finds openings by alias — "Larsen" → Nimzo-Larsen Attack', async () => {
    const store = useOpeningsStore()
    await store.load()
    store.query = 'larsen'
    const hits = store.searchResults
    const nimzoLarsen = hits.find((h) => h.node.id === 'nimzo-larsen')
    expect(nimzoLarsen).toBeTruthy()
    store.query = "larsen's opening"
    expect(store.searchResults.some((h) => h.node.id === 'nimzo-larsen')).toBe(true)
    expect(
      store.searchResults.find((h) => h.node.id === 'nimzo-larsen')!.matchedAlias,
    ).toBe("Larsen's Opening")
  })

  it('search is honest about excluded openings', async () => {
    const store = useOpeningsStore()
    await store.load()
    store.query = 'bongcloud'
    const hit = store.searchResults.find((h) => h.node.id === 'bongcloud')
    expect(hit).toBeTruthy()
    expect(hit!.node.tier).toBe('excluded')
    expect(hit!.node.notes).toBeTruthy()
  })

  it('side filter hides trees with no matching entries', async () => {
    const store = useOpeningsStore()
    await store.load()
    store.side = 'black'
    // London System is a White system with no Black-side entries beneath it.
    expect(store.visibleIds.has('london-system')).toBe(false)
    // The Sicilian family stays: it is Black's choice.
    expect(store.visibleIds.has('sicilian-defense')).toBe(true)
    // White-side anti-Sicilians inside it remain reachable ancestors' children
    // but only if they match; the Alapin is White's choice, so it hides.
    expect(store.visibleIds.has('sicilian-alapin')).toBe(false)
  })
})
