/**
 * Converts parsed PGN into the canonical Study model, replaying every
 * move through the rules engine to validate legality and generate FENs.
 */
import type {
  Annotation,
  ChessMove,
  MoveClassification,
  Study,
  StudyNode,
  StudyType,
} from '../../../domain/study/types'
import { createEngine, STARTING_FEN } from '../engine'
import { parsePgn, PgnParseError, type PgnMoveNode } from './parse'

const NAG_CLASSIFICATIONS: Record<number, MoveClassification> = {
  1: 'interesting',
  2: 'mistake',
  3: 'critical',
  4: 'blunder',
  5: 'interesting',
  6: 'interesting',
}

export interface PgnToStudyOptions {
  id?: string
  type?: StudyType
}

export function pgnToStudy(pgn: string, options: PgnToStudyOptions = {}): Study {
  const parsed = parsePgn(pgn)
  const headers = parsed.headers

  const initialFen = headers.FEN
  const nodes: Record<string, StudyNode> = {}
  let counter = 0
  const newId = () => `n${counter++}`

  const rootId = newId()
  nodes[rootId] = {
    id: rootId,
    fen: initialFen ?? STARTING_FEN,
    ply: 0,
    children: [],
  }

  /** Adds a line of moves branching from parentId; recurses into variations. */
  function buildLine(moves: PgnMoveNode[], startParentId: string): void {
    let parentId = startParentId
    for (const pgnMove of moves) {
      const parent = nodes[parentId]
      const engine = createEngine(parent.fen)
      const moveNumber = engine.moveNumber()
      const detail = engine.move(pgnMove.san)
      if (!detail) {
        throw new PgnParseError(
          `Illegal move "${pgnMove.san}" at move ${moveNumber} (from position ${parent.fen})`,
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
      const nag = pgnMove.nags.find((n) => NAG_CLASSIFICATIONS[n] !== undefined)
      if (nag !== undefined) move.classification = NAG_CLASSIFICATIONS[nag]

      const nodeId = newId()
      const node: StudyNode = {
        id: nodeId,
        fen: engine.fen(),
        parentId,
        moveFromParent: move,
        ply: parent.ply + 1,
        children: [],
      }
      if (pgnMove.comments.length > 0) {
        node.annotations = pgnMove.comments.map(
          (body, i): Annotation => ({ id: `${nodeId}-a${i}`, type: 'commentary', body }),
        )
      }
      nodes[nodeId] = node
      parent.children.push(nodeId)
      if (!parent.preferredChildId) parent.preferredChildId = nodeId

      for (const variation of pgnMove.variations) {
        buildLine(variation, parentId)
      }
      parentId = nodeId
    }
  }

  buildLine(parsed.moves, rootId)

  const white = cleanName(headers.White)
  const black = cleanName(headers.Black)
  const title = white && black ? `${white} vs ${black}` : 'Imported Study'

  const study: Study = {
    id: options.id ?? `imported-${crypto.randomUUID()}`,
    slug: slugify(title),
    title,
    type: options.type ?? 'game',
    tags: [],
    concepts: [],
    source: 'local',
    rootNodeId: rootId,
    nodes,
    createdAt: new Date().toISOString(),
  }
  if (initialFen) study.initialFen = initialFen

  const metadata: Study['metadata'] = {}
  if (white) metadata.white = white
  if (black) metadata.black = black
  if (headers.Event) metadata.event = headers.Event
  if (headers.Site) metadata.site = headers.Site
  if (headers.Date) metadata.date = headers.Date
  if (parsed.result) metadata.result = parsed.result
  if (headers.ECO) metadata.eco = headers.ECO
  if (headers.Opening) metadata.opening = headers.Opening
  if (Object.keys(metadata).length > 0) study.metadata = metadata

  return study
}

function cleanName(name: string | undefined): string | undefined {
  if (!name) return undefined
  const trimmed = name.trim()
  return trimmed === '' || trimmed === '?' ? undefined : trimmed
}

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'imported-study'
  )
}
