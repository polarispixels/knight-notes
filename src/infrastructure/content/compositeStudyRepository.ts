import type { Study } from '../../domain/study/types'
import type { StudyRepository } from '../repository'

/**
 * Merges bundled (read-only) and local (writable) studies behind one
 * repository. Reads prefer local; writes always go to local.
 */
export class CompositeStudyRepository implements StudyRepository {
  private readonly bundled: StudyRepository
  private readonly local: StudyRepository

  constructor(bundled: StudyRepository, local: StudyRepository) {
    this.bundled = bundled
    this.local = local
  }

  async list() {
    // A broken local store (private mode, blocked storage) must never
    // take the bundled catalog down with it.
    const [bundledList, localList] = await Promise.all([
      this.bundled.list(),
      this.local.list().catch((e) => {
        console.error('Local study storage unavailable:', e)
        return []
      }),
    ])
    const localIds = new Set(localList.map((s) => s.id))
    return [...bundledList.filter((s) => !localIds.has(s.id)), ...localList]
  }

  async get(id: string): Promise<Study | null> {
    let local: Study | null = null
    try {
      local = await this.local.get(id)
    } catch (e) {
      console.error('Local study storage unavailable:', e)
    }
    return local ?? (await this.bundled.get(id))
  }

  async save(study: Study) {
    await this.local.save(study)
  }

  async delete(id: string) {
    if (await this.local.get(id)) {
      await this.local.delete(id)
      return
    }
    if (await this.bundled.get(id)) {
      throw new Error('Bundled studies cannot be deleted')
    }
  }
}
