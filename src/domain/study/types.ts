/**
 * Canonical KnightNotes domain model.
 * This layer is pure TypeScript with zero runtime dependencies.
 */

export type StudyType =
  | 'game'
  | 'opening'
  | 'variation'
  | 'gambit'
  | 'trap'
  | 'tactic'
  | 'endgame'
  | 'pattern'

export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

export type Side = 'white' | 'black'

export type MoveClassification =
  | 'normal'
  | 'interesting'
  | 'critical'
  | 'theory'
  | 'forced'
  | 'mistake'
  | 'blunder'
  | 'sacrifice'
  | 'novelty'

export type ImportanceLevel = 'normal' | 'notable' | 'important' | 'critical'

export type AnnotationType =
  | 'commentary'
  | 'question'
  | 'key-idea'
  | 'critical-position'
  | 'principle'
  | 'warning'
  | 'historical'
  | 'mistake'
  | 'strategy'
  | 'tactic'

export interface Annotation {
  id: string
  type: AnnotationType
  title?: string
  body: string
  concepts?: string[]
}

export type VisualAnnotation =
  | { type: 'square'; square: string; style?: string }
  | { type: 'arrow'; from: string; to: string; style?: string }

export interface ChessMove {
  san: string
  from?: string
  to?: string
  promotion?: string
  moveNumber?: number
  side: Side
  classification?: MoveClassification
  importance?: ImportanceLevel
}

export interface StudyNode {
  id: string
  fen: string
  parentId?: string
  moveFromParent?: ChessMove
  ply: number
  annotations?: Annotation[]
  visualAnnotations?: VisualAnnotation[]
  children: string[]
  preferredChildId?: string
}

export interface StudyMetadata {
  white?: string
  black?: string
  event?: string
  site?: string
  date?: string
  result?: string
  eco?: string
  opening?: string
  historicalContext?: string
}

export type StudySource = 'bundled' | 'local'

export interface Study {
  id: string
  slug: string
  /** Optional human-friendly catalog code (e.g. "G001") used for library ordering. */
  catalogCode?: string
  /** Which side this study teaches for (e.g. Italian → white, Caro-Kann → black). Absent = color-agnostic. */
  focus?: Side
  title: string
  subtitle?: string
  type: StudyType
  description?: string
  summary?: string
  difficulty?: Difficulty
  tags: string[]
  concepts: string[]
  source?: StudySource
  metadata?: StudyMetadata
  initialFen?: string
  rootNodeId: string
  nodes: Record<string, StudyNode>
  createdAt?: string
  updatedAt?: string
}

export interface StudySummary {
  id: string
  slug: string
  catalogCode?: string
  focus?: Side
  title: string
  subtitle?: string
  type: StudyType
  difficulty?: Difficulty
  summary?: string
  tags: string[]
  concepts: string[]
  metadata?: StudyMetadata
  source: StudySource
}
