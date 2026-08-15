/**
 * Pure traversal functions over the Study tree.
 * The Study is the single source of truth; every position and line is
 * derived from it, never stored separately.
 */
import type { Study, StudyNode } from './types'

export function getNode(study: Study, nodeId: string): StudyNode {
  const node = study.nodes[nodeId]
  if (!node) {
    throw new Error(`Study "${study.id}" has no node "${nodeId}"`)
  }
  return node
}

/** Root-to-node path, inclusive of both ends. */
export function pathToNode(study: Study, nodeId: string): string[] {
  const path: string[] = []
  let current: StudyNode | undefined = getNode(study, nodeId)
  while (current) {
    path.push(current.id)
    current = current.parentId ? getNode(study, current.parentId) : undefined
  }
  return path.reverse()
}

/**
 * The node Next should move to: an explicitly selected child wins,
 * then preferredChildId, then the first child; null at the end of a line.
 */
export function nextNodeId(
  study: Study,
  nodeId: string,
  selectedChildId?: string,
): string | null {
  const node = getNode(study, nodeId)
  if (selectedChildId && node.children.includes(selectedChildId)) {
    return selectedChildId
  }
  if (node.preferredChildId && node.children.includes(node.preferredChildId)) {
    return node.preferredChildId
  }
  return node.children[0] ?? null
}

export function prevNodeId(study: Study, nodeId: string): string | null {
  return getNode(study, nodeId).parentId ?? null
}

/** Follow preferred/first children from a node to the end of that line. */
export function mainlineEndId(study: Study, fromId: string): string {
  let currentId = fromId
  for (;;) {
    const next = nextNodeId(study, currentId)
    if (next === null) return currentId
    currentId = next
  }
}

/** The full preferred line of the study, root first. */
export function mainlineIds(study: Study): string[] {
  const ids: string[] = [study.rootNodeId]
  let next = nextNodeId(study, study.rootNodeId)
  while (next !== null) {
    ids.push(next)
    next = nextNodeId(study, next)
  }
  return ids
}

/** Children of a node other than the one Next would follow. */
export function variationsAt(study: Study, nodeId: string): StudyNode[] {
  const node = getNode(study, nodeId)
  const mainChild = nextNodeId(study, nodeId)
  return node.children
    .filter((childId) => childId !== mainChild)
    .map((childId) => getNode(study, childId))
}

export interface MoveRow {
  number: number
  whiteNodeId?: string
  blackNodeId?: string
}

/**
 * Group a line of node ids into two-column notation rows.
 * Move numbers come from the move itself when present (FEN starts),
 * otherwise they are derived from ply.
 */
export function moveRows(study: Study, lineIds: string[]): MoveRow[] {
  const rows: MoveRow[] = []
  for (const id of lineIds) {
    const node = getNode(study, id)
    const move = node.moveFromParent
    if (!move) continue
    const number = move.moveNumber ?? Math.ceil(node.ply / 2)
    const last = rows[rows.length - 1]
    if (move.side === 'white') {
      rows.push({ number, whiteNodeId: id, blackNodeId: undefined })
    } else if (last && last.number === number && last.blackNodeId === undefined) {
      last.blackNodeId = id
    } else {
      rows.push({ number, whiteNodeId: undefined, blackNodeId: id })
    }
  }
  return rows
}
