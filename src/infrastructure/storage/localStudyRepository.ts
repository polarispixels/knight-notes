import { openDB, type IDBPDatabase } from 'idb'
import type { Study } from '../../domain/study/types'
import { toSummary } from '../../domain/study/summary'
import type { StudyRepository } from '../repository'

const STORE = 'studies'

/** Studies the user imported, persisted in IndexedDB. */
export function createLocalRepository(dbName = 'knightnotes'): StudyRepository {
  let dbPromise: Promise<IDBPDatabase> | null = null
  const db = () => {
    dbPromise ??= openDB(dbName, 1, {
      upgrade(database) {
        database.createObjectStore(STORE, { keyPath: 'id' })
      },
    })
    return dbPromise
  }

  return {
    async list() {
      const studies: Study[] = await (await db()).getAll(STORE)
      return studies.map((s) => toSummary(s, 'local'))
    },
    async get(id) {
      const study: Study | undefined = await (await db()).get(STORE, id)
      return study ? { ...study, source: 'local' } : null
    },
    async save(study) {
      await (await db()).put(STORE, { ...study, source: 'local' })
    },
    async delete(id) {
      await (await db()).delete(STORE, id)
    },
  }
}
