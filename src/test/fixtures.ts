import type { Study } from '../domain/study/types'
import { pgnToStudy } from '../infrastructure/chess/pgn/toStudy'

/**
 * Italian-opening fixture with a variation and annotations:
 * 1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 (3... Nf6) 4. c3
 */
export function branchingStudy(id = 'fixture-italian'): Study {
  const study = pgnToStudy(
    `[White "Fixture"]
[Black "Study"]

1. e4 {Claims the center.} e5 2. Nf3 Nc6 3. Bc4 Bc5 (3... Nf6 {The Two Knights.}) 4. c3 *`,
    { id, type: 'opening' },
  )
  study.title = 'Italian Fixture'
  study.slug = id
  return study
}
