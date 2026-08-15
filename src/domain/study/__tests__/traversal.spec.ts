import { describe, it, expect } from 'vitest'
import type { Study, StudyNode, ChessMove } from '../types'
import {
  getNode,
  pathToNode,
  nextNodeId,
  prevNodeId,
  mainlineEndId,
  mainlineIds,
  variationsAt,
  moveRows,
} from '../traversal'

function node(
  id: string,
  ply: number,
  parentId: string | undefined,
  move: Partial<ChessMove> | undefined,
  children: string[] = [],
  preferredChildId?: string,
): StudyNode {
  return {
    id,
    fen: `fen-${id}`,
    parentId,
    moveFromParent: move
      ? { san: move.san ?? '??', side: move.side ?? 'white', ...move }
      : undefined,
    ply,
    children,
    preferredChildId,
  }
}

/**
 * root -e4- n1 -e5- n2 -Nf3- n3 -Nc6(preferred)- n4 -Bc4- n6
 *                             \-Nf6(variation)-- n5
 */
function fixture(): Study {
  const nodes: Record<string, StudyNode> = {
    root: node('root', 0, undefined, undefined, ['n1']),
    n1: node('n1', 1, 'root', { san: 'e4', side: 'white' }, ['n2']),
    n2: node('n2', 2, 'n1', { san: 'e5', side: 'black' }, ['n3']),
    n3: node('n3', 3, 'n2', { san: 'Nf3', side: 'white' }, ['n4', 'n5'], 'n4'),
    n4: node('n4', 4, 'n3', { san: 'Nc6', side: 'black' }, ['n6']),
    n5: node('n5', 4, 'n3', { san: 'Nf6', side: 'black' }, []),
    n6: node('n6', 5, 'n4', { san: 'Bc4', side: 'white' }, []),
  }
  return {
    id: 's1',
    slug: 's1',
    title: 'Fixture',
    type: 'opening',
    tags: [],
    concepts: [],
    rootNodeId: 'root',
    nodes,
  }
}

describe('getNode', () => {
  it('returns the node by id', () => {
    expect(getNode(fixture(), 'n3').moveFromParent?.san).toBe('Nf3')
  })
  it('throws on unknown id', () => {
    expect(() => getNode(fixture(), 'nope')).toThrow()
  })
})

describe('pathToNode', () => {
  it('returns root-to-node inclusive', () => {
    expect(pathToNode(fixture(), 'n6')).toEqual(['root', 'n1', 'n2', 'n3', 'n4', 'n6'])
  })
  it('works for a variation node', () => {
    expect(pathToNode(fixture(), 'n5')).toEqual(['root', 'n1', 'n2', 'n3', 'n5'])
  })
  it('returns just the root for the root', () => {
    expect(pathToNode(fixture(), 'root')).toEqual(['root'])
  })
})

describe('nextNodeId', () => {
  it('follows the only child', () => {
    expect(nextNodeId(fixture(), 'root')).toBe('n1')
  })
  it('follows preferredChildId at a branch', () => {
    expect(nextNodeId(fixture(), 'n3')).toBe('n4')
  })
  it('follows an explicitly selected child over the preferred one', () => {
    expect(nextNodeId(fixture(), 'n3', 'n5')).toBe('n5')
  })
  it('falls back to first child when no preferred is set', () => {
    const s = fixture()
    s.nodes.n3.preferredChildId = undefined
    expect(nextNodeId(s, 'n3')).toBe('n4')
  })
  it('returns null at the end of a line', () => {
    expect(nextNodeId(fixture(), 'n6')).toBeNull()
  })
})

describe('prevNodeId', () => {
  it('returns the parent', () => {
    expect(prevNodeId(fixture(), 'n4')).toBe('n3')
  })
  it('returns null at the root', () => {
    expect(prevNodeId(fixture(), 'root')).toBeNull()
  })
})

describe('mainlineEndId / mainlineIds', () => {
  it('follows preferred children to the end', () => {
    expect(mainlineEndId(fixture(), 'root')).toBe('n6')
  })
  it('mainlineIds lists the whole preferred line from the root', () => {
    expect(mainlineIds(fixture())).toEqual(['root', 'n1', 'n2', 'n3', 'n4', 'n6'])
  })
  it('mainlineEndId from a variation stays on that branch', () => {
    expect(mainlineEndId(fixture(), 'n5')).toBe('n5')
  })
})

describe('variationsAt', () => {
  it('returns non-mainline children of the node', () => {
    const vars = variationsAt(fixture(), 'n3')
    expect(vars.map((v) => v.id)).toEqual(['n5'])
  })
  it('returns empty when there is a single child', () => {
    expect(variationsAt(fixture(), 'n1')).toEqual([])
  })
})

describe('moveRows', () => {
  it('pairs white and black moves with move numbers', () => {
    const s = fixture()
    const rows = moveRows(s, mainlineIds(s))
    expect(rows).toEqual([
      { number: 1, whiteNodeId: 'n1', blackNodeId: 'n2' },
      { number: 2, whiteNodeId: 'n3', blackNodeId: 'n4' },
      { number: 3, whiteNodeId: 'n6', blackNodeId: undefined },
    ])
  })
  it('handles a line that starts with a black move (FEN start)', () => {
    const nodes: Record<string, StudyNode> = {
      root: node('root', 0, undefined, undefined, ['b1']),
      b1: node('b1', 1, 'root', { san: 'Rd8', side: 'black', moveNumber: 30 }, ['w2']),
      w2: node('w2', 2, 'b1', { san: 'Kf1', side: 'white', moveNumber: 31 }, []),
    }
    const s: Study = {
      id: 's2',
      slug: 's2',
      title: 'Endgame',
      type: 'endgame',
      tags: [],
      concepts: [],
      rootNodeId: 'root',
      nodes,
    }
    const rows = moveRows(s, ['root', 'b1', 'w2'])
    expect(rows).toEqual([
      { number: 30, whiteNodeId: undefined, blackNodeId: 'b1' },
      { number: 31, whiteNodeId: 'w2', blackNodeId: undefined },
    ])
  })
})
