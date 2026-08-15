import type { Study, StudyType } from '../../domain/study/types'
import { pgnToStudy } from '../../infrastructure/chess/pgn/toStudy'
import { getRepository } from '../repositoryProvider'

/** The import workflow: parse PGN, persist the study, hand it back. */
export async function importPgn(pgn: string, type?: StudyType): Promise<Study> {
  const study = pgnToStudy(pgn, type ? { type } : {})
  await getRepository().save(study)
  return study
}
