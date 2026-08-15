import type { StudyRepository } from '../infrastructure/repository'

/**
 * The application's single StudyRepository. Wired at startup (composite of
 * bundled + local) and replaced with fakes in tests.
 */
let repository: StudyRepository | null = null

export function provideRepository(repo: StudyRepository): void {
  repository = repo
}

export function getRepository(): StudyRepository {
  if (!repository) throw new Error('StudyRepository has not been provided')
  return repository
}
