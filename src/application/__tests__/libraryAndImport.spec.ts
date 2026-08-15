import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { createPinia, setActivePinia } from 'pinia'
import { branchingStudy } from '../../test/fixtures'
import { createBundledRepository } from '../../infrastructure/content/bundledStudyRepository'
import { createLocalRepository } from '../../infrastructure/storage/localStudyRepository'
import { CompositeStudyRepository } from '../../infrastructure/content/compositeStudyRepository'
import { provideRepository, getRepository } from '../repositoryProvider'
import { useLibraryStore } from '../library/libraryStore'
import { CATEGORIES, categoryOf } from '../library/categories'
import { importPgn } from '../import/importPgn'
import { pgnToStudy } from '../../infrastructure/chess/pgn/toStudy'

function setupRepo() {
  const opening = branchingStudy('italian')
  const trap = pgnToStudy('1. e4 e5 2. Nf3 Nc6 3. Bc4 Nd4', { id: 'noahs', type: 'trap' })
  const repo = new CompositeStudyRepository(
    createBundledRepository([opening, trap]),
    createLocalRepository(`test-db-${Math.random().toString(36).slice(2)}`),
  )
  provideRepository(repo)
  return repo
}

beforeEach(() => {
  setActivePinia(createPinia())
  setupRepo()
})

describe('categories', () => {
  it('maps every study type to a category', () => {
    expect(categoryOf('game')).toBe('famous-games')
    expect(categoryOf('opening')).toBe('openings')
    expect(categoryOf('variation')).toBe('openings')
    expect(categoryOf('gambit')).toBe('gambits')
    expect(categoryOf('trap')).toBe('traps')
    expect(categoryOf('tactic')).toBe('tactics')
    expect(categoryOf('pattern')).toBe('tactics')
    expect(categoryOf('endgame')).toBe('endgames')
    expect(CATEGORIES.map((c) => c.id)).toContain('famous-games')
  })
})

describe('libraryStore', () => {
  it('loads summaries and filters by category', async () => {
    const library = useLibraryStore()
    await library.load()
    expect(library.summaries).toHaveLength(2)
    expect(library.filtered).toHaveLength(2)
    library.setCategory('traps')
    expect(library.filtered.map((s) => s.id)).toEqual(['noahs'])
    library.setCategory('all')
    expect(library.filtered).toHaveLength(2)
  })
})

describe('importPgn', () => {
  it('parses, saves, and returns the study', async () => {
    const study = await importPgn('[White "A"]\n[Black "B"]\n\n1. d4 d5 2. c4')
    expect(study.title).toBe('A vs B')
    const persisted = await getRepository().get(study.id)
    expect(persisted?.nodes[persisted.rootNodeId].children).toHaveLength(1)
  })

  it('propagates parse errors', async () => {
    await expect(importPgn('not chess')).rejects.toThrow()
  })
})
