import type { Study } from '../../domain/study/types'
import { toSummary } from '../../domain/study/summary'
import type { StudyRepository } from '../repository'
import { seedToStudy, type StudySeed } from './seed'

/** Read-only repository over studies shipped with the application. */
export function createBundledRepository(studies: Study[]): StudyRepository {
  const byId = new Map(studies.map((s) => [s.id, s]))
  return {
    async list() {
      return studies.map((s) => toSummary(s, 'bundled'))
    },
    async get(id) {
      const study = byId.get(id)
      return study ? { ...study, source: 'bundled' } : null
    },
    async save() {
      throw new Error('Bundled studies are read-only')
    },
    async delete() {
      throw new Error('Bundled studies are read-only')
    },
  }
}

/**
 * Converts seeds to canonical Studies, isolating failures: one broken
 * seed must never take the whole application down. (The test suite keeps
 * broken seeds from shipping; this is defense in depth.)
 */
export function convertSeeds(seeds: StudySeed[]): Study[] {
  const studies: Study[] = []
  for (const seed of seeds) {
    try {
      studies.push(seedToStudy(seed))
    } catch (e) {
      console.error(`Skipping broken bundled study "${seed?.id}":`, e)
    }
  }
  return studies
}

/**
 * Loads the StudySeed files bundled in src/content and converts them to
 * canonical Studies (moves replayed through the engine — see seed.ts).
 */
export function loadBundledStudies(): Study[] {
  const modules = import.meta.glob<StudySeed>('../../content/**/*.json', {
    eager: true,
    import: 'default',
  })
  return convertSeeds(Object.values(modules))
}
