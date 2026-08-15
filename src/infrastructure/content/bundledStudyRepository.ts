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
 * Loads the StudySeed files bundled in src/content and converts them to
 * canonical Studies (moves replayed through the engine — see seed.ts).
 */
export function loadBundledStudies(): Study[] {
  const modules = import.meta.glob<StudySeed>('../../content/**/*.json', {
    eager: true,
    import: 'default',
  })
  return Object.values(modules).map(seedToStudy)
}
