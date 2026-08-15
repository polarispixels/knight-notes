import type { Study, StudySummary } from '../domain/study/types'

/**
 * Storage-agnostic access to studies. The rest of the application depends
 * on this interface, never on a concrete persistence mechanism.
 */
export interface StudyRepository {
  list(): Promise<StudySummary[]>
  get(id: string): Promise<Study | null>
  save(study: Study): Promise<void>
  delete(id: string): Promise<void>
}
