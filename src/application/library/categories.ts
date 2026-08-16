import type { StudyType } from '../../domain/study/types'

export interface Category {
  id: string
  label: string
  types: StudyType[]
}

/** Library categories. Adding one is a data change, not an architecture change. */
export const CATEGORIES: Category[] = [
  { id: 'famous-games', label: 'Famous Games', types: ['game'] },
  { id: 'openings', label: 'Openings', types: ['opening', 'variation'] },
  { id: 'gambits', label: 'Gambits', types: ['gambit'] },
  { id: 'traps', label: 'Traps', types: ['trap'] },
  { id: 'tactics', label: 'Tactics', types: ['tactic', 'pattern'] },
  { id: 'endgames', label: 'Endgames', types: ['endgame'] },
  { id: 'concepts', label: 'Concepts', types: ['concept'] },
]

export function categoryOf(type: StudyType): string {
  return CATEGORIES.find((c) => c.types.includes(type))?.id ?? 'famous-games'
}
