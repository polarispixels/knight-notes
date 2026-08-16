import bundledSummaries from 'virtual:study-summaries'
import type { Study } from '../../domain/study/types'
import type { StudyRepository } from '../repository'
import { seedToStudy, type StudySeed } from './seed'

/**
 * Read-only repository over the studies shipped with the application,
 * loading each study's seed as its own chunk on first open. Listing uses
 * the build-time summary projection (virtual:study-summaries), so the
 * library renders without shipping or replaying any full study.
 *
 * Relies on the content contract that a seed's filename equals its id
 * (enforced by the bundled-content test gate).
 */
export function createLazyBundledRepository(): StudyRepository {
  const loaders = new Map<string, () => Promise<StudySeed>>()
  for (const [path, load] of Object.entries(
    import.meta.glob<StudySeed>('../../content/**/*.json', { import: 'default' }),
  )) {
    const id = path.slice(path.lastIndexOf('/') + 1).replace(/\.json$/, '')
    loaders.set(id, load)
  }
  const cache = new Map<string, Study>()

  return {
    async list() {
      return bundledSummaries.map((s) => ({ ...s, source: 'bundled' as const }))
    },
    async get(id) {
      const cached = cache.get(id)
      if (cached) return { ...cached, source: 'bundled' }
      const load = loaders.get(id)
      if (!load) return null
      try {
        const study = seedToStudy(await load())
        cache.set(id, study)
        return { ...study, source: 'bundled' }
      } catch (e) {
        // The test gate keeps broken seeds from shipping; defense in depth.
        console.error(`Skipping broken bundled study "${id}":`, e)
        return null
      }
    },
    async save() {
      throw new Error('Bundled studies are read-only')
    },
    async delete() {
      throw new Error('Bundled studies are read-only')
    },
  }
}
