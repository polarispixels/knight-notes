/**
 * StudySeed is the authoring format for bundled content: moves as SAN plus
 * educational annotations. Like PGN, it is an interchange format — it is
 * converted to the canonical Study model here, with every move replayed
 * through the rules engine so FENs and plies are always correct.
 */
import type {
  Annotation,
  AnnotationType,
  ChessMove,
  Difficulty,
  ImportanceLevel,
  MoveClassification,
  Side,
  Study,
  StudyMetadata,
  StudyType,
  VisualAnnotation,
} from '../../domain/study/types'
import { createEngine, STARTING_FEN } from '../chess/engine'
import { validateSeed } from './validateSeed'

export interface AnnotationSeed {
  type: AnnotationType
  title?: string
  body: string
  concepts?: string[]
}

export interface MoveSeed {
  san: string
  classification?: MoveClassification
  importance?: ImportanceLevel
  annotations?: AnnotationSeed[]
  visual?: VisualAnnotation[]
  /** Alternative lines replacing THIS move. */
  variations?: MoveSeedInput[][]
}

/** A move in authoring form: a bare SAN string, or an object when it carries metadata. */
export type MoveSeedInput = string | MoveSeed

function asMoveSeed(input: MoveSeedInput): MoveSeed {
  return typeof input === 'string' ? { san: input } : input
}

export interface StudySeed {
  id: string
  slug?: string
  catalogCode?: string
  /** Which side the study teaches for; omit for color-agnostic content. */
  focus?: Side
  title: string
  subtitle?: string
  type: StudyType
  difficulty?: Difficulty
  summary?: string
  description?: string
  tags?: string[]
  concepts?: string[]
  metadata?: StudyMetadata
  initialFen?: string
  rootAnnotations?: AnnotationSeed[]
  rootVisual?: VisualAnnotation[]
  line: MoveSeedInput[]
}

export class SeedError extends Error {}

export function seedToStudy(seed: StudySeed): Study {
  const schemaErrors = validateSeed(seed)
  if (schemaErrors.length > 0) {
    throw new SeedError(
      `Study "${(seed as { id?: string })?.id ?? '?'}" has invalid authoring data:\n  ${schemaErrors.join('\n  ')}`,
    )
  }
  const nodes: Study['nodes'] = {}
  let counter = 0
  const newId = () => `n${counter++}`

  const rootId = newId()
  nodes[rootId] = {
    id: rootId,
    fen: seed.initialFen ?? STARTING_FEN,
    ply: 0,
    children: [],
    annotations: withIds(rootId, seed.rootAnnotations),
    visualAnnotations: seed.rootVisual,
  }

  function buildLine(moves: MoveSeedInput[], startParentId: string): void {
    let parentId = startParentId
    for (const moveSeed of moves.map(asMoveSeed)) {
      const parent = nodes[parentId]
      const engine = createEngine(parent.fen)
      const moveNumber = engine.moveNumber()
      const detail = engine.move(moveSeed.san)
      if (!detail) {
        throw new SeedError(
          `Study "${seed.id}": illegal move "${moveSeed.san}" at move ${moveNumber} (from ${parent.fen})`,
        )
      }

      const move: ChessMove = {
        san: detail.san,
        from: detail.from,
        to: detail.to,
        moveNumber,
        side: detail.side,
      }
      if (detail.promotion) move.promotion = detail.promotion
      if (moveSeed.classification) move.classification = moveSeed.classification
      if (moveSeed.importance) move.importance = moveSeed.importance

      const nodeId = newId()
      nodes[nodeId] = {
        id: nodeId,
        fen: engine.fen(),
        parentId,
        moveFromParent: move,
        ply: parent.ply + 1,
        children: [],
        annotations: withIds(nodeId, moveSeed.annotations),
        visualAnnotations: moveSeed.visual,
      }
      parent.children.push(nodeId)
      if (!parent.preferredChildId) parent.preferredChildId = nodeId

      for (const variation of moveSeed.variations ?? []) {
        buildLine(variation, parentId)
      }
      parentId = nodeId
    }
  }

  buildLine(seed.line, rootId)

  const study: Study = {
    id: seed.id,
    slug: seed.slug ?? seed.id,
    title: seed.title,
    type: seed.type,
    tags: seed.tags ?? [],
    concepts: seed.concepts ?? [],
    source: 'bundled',
    rootNodeId: rootId,
    nodes,
  }
  if (seed.catalogCode) study.catalogCode = seed.catalogCode
  if (seed.focus) study.focus = seed.focus
  if (seed.subtitle) study.subtitle = seed.subtitle
  if (seed.difficulty) study.difficulty = seed.difficulty
  if (seed.summary) study.summary = seed.summary
  if (seed.description) study.description = seed.description
  if (seed.metadata) study.metadata = seed.metadata
  if (seed.initialFen) study.initialFen = seed.initialFen
  return study
}

function withIds(nodeId: string, seeds?: AnnotationSeed[]): Annotation[] | undefined {
  if (!seeds || seeds.length === 0) return undefined
  return seeds.map((a, i) => ({ ...a, id: `${nodeId}-a${i}` }))
}
