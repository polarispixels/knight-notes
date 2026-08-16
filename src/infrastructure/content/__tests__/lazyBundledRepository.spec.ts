import { describe, it, expect } from 'vitest'
import bundledSummaries from 'virtual:study-summaries'
import { toSummary } from '../../../domain/study/summary'
import { loadBundledStudies } from '../bundledStudyRepository'
import { createLazyBundledRepository } from '../lazyBundledRepository'

/**
 * The lazy repository serves summaries from a build-time projection and
 * studies from on-demand chunks. These tests pin both to the eager
 * pipeline: same catalog, same summaries, same studies.
 */
describe('lazy bundled repository', () => {
  const eager = loadBundledStudies()

  it('summary projection matches toSummary for every study', () => {
    const expected = new Map(eager.map((s) => [s.id, toSummary(s, 'bundled')]))
    expect(bundledSummaries.length).toBe(eager.length)
    for (const summary of bundledSummaries) {
      expect({ ...summary, source: 'bundled' }).toEqual(expected.get(summary.id))
    }
  })

  it('every content filename equals its study id (the lookup contract)', () => {
    const files = Object.keys(import.meta.glob('../../../content/**/*.json'))
    const ids = new Set(eager.map((s) => s.id))
    for (const path of files) {
      const base = path.slice(path.lastIndexOf('/') + 1).replace(/\.json$/, '')
      expect(ids.has(base), `${path} filename must match its seed id`).toBe(true)
    }
  })

  it('list() and get() serve the same content as the eager pipeline', async () => {
    const repo = createLazyBundledRepository()
    const listed = await repo.list()
    expect(listed.map((s) => s.id).sort()).toEqual(eager.map((s) => s.id).sort())

    const sample = eager.find((s) => s.id === 'ruy-lopez')!
    const loaded = await repo.get('ruy-lopez')
    expect(loaded).toEqual({ ...sample, source: 'bundled' })
    expect(await repo.get('no-such-study')).toBeNull()
  })
})
