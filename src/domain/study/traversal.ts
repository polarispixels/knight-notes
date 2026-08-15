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

/**
 * Content-stable locator for a node: the SAN sequence from the root.
 * Survives re-generation of synthetic node ids when content is edited.
 */
export function sanPathTo(study: Study, nodeId: string): string[] {
  return pathToNode(study, nodeId)
    .map((id) => getNode(study, id).moveFromParent?.san)
    .filter((san): san is string => san !== undefined)
}

/** Resolve a SAN path back to a node id, or null if the line no longer exists. */
export function nodeAtSanPath(study: Study, sans: string[]): string | null {
  let currentId = study.rootNodeId
  for (const san of sans) {
    const node = study.nodes[currentId]
    if (!node) return null
    const child = node.children.find(
      (childId) => study.nodes[childId]?.moveFromParent?.san === san,
    )
    if (!child) return null
    currentId = child
  }
  return currentId
}

/** Display label for a node's move, e.g. "2. Nf3" / "2… Nc6"; null at the root. */
export function moveLabel(node: StudyNode): string | null {
  const move = node.moveFromParent
  if (!move) return null
  const number = move.moveNumber ?? Math.ceil(node.ply / 2)
  return `${number}${move.side === 'black' ? '…' : '.'} ${move.san}`
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
