import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { branchingStudy } from '../../test/fixtures'
import { createBundledRepository } from '../../infrastructure/content/bundledStudyRepository'
import { provideRepository } from '../repositoryProvider'
import { useSessionStore } from '../session/sessionStore'
import { getNode, mainlineIds } from '../../domain/study/traversal'
import { STARTING_FEN } from '../../infrastructure/chess/engine'

beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
  provideRepository(createBundledRepository([branchingStudy()]))
})

async function loaded() {
  const session = useSessionStore()
  await session.loadStudy('fixture-italian')
  return session
}

describe('sessionStore', () => {
  it('loads a study at its root position', async () => {
    const session = await loaded()
    expect(session.study?.title).toBe('Italian Fixture')
    expect(session.currentFen).toBe(STARTING_FEN)
    expect(session.canPrevious).toBe(false)
    expect(session.canNext).toBe(true)
  })

  it('reports an error for a missing study', async () => {
    const session = useSessionStore()
    await session.loadStudy('nope')
    expect(session.study).toBeNull()
    expect(session.error).toMatch(/not found/i)
  })

  it('next advances along the main line; previous returns', async () => {
    const session = await loaded()
    session.next()
    expect(session.currentNode?.moveFromParent?.san).toBe('e4')
    expect(session.currentFen).toContain('4P3')
    session.next()
    expect(session.currentNode?.moveFromParent?.san).toBe('e5')
    session.previous()
    expect(session.currentNode?.moveFromParent?.san).toBe('e4')
  })

  it('toEnd runs to the end of the main line; toStart returns to root', async () => {
    const session = await loaded()
    session.toEnd()
    expect(session.currentNode?.moveFromParent?.san).toBe('c3')
    expect(session.canNext).toBe(false)
    session.toStart()
    expect(session.currentNodeId).toBe(session.study?.rootNodeId)
  })

  it('exposes annotations and last move for the current node', async () => {
    const session = await loaded()
    session.next()
    expect(session.annotations[0]?.body).toBe('Claims the center.')
    expect(session.lastMove).toEqual({ from: 'e2', to: 'e4' })
  })

  it('lists variations at a branch point and follows a selected one', async () => {
    const session = await loaded()
    const study = session.study!
    // advance to the position after 3. Bc4 (ply 5), where Black has options
    for (let i = 0; i < 5; i++) session.next()
    expect(session.variations.map((v) => v.moveFromParent?.san)).toEqual(['Nf6'])
    const nf6 = session.variations[0]
    session.selectVariation(nf6.id)
    expect(session.currentNodeId).toBe(nf6.id)
    expect(session.onMainLine).toBe(false)
    expect(session.lineIds).toContain(nf6.id)
    // returning to the main line lands on the fork position (after 3. Bc4)
    session.returnToMainLine()
    expect(session.currentNode?.moveFromParent?.san).toBe('Bc4')
    expect(session.onMainLine).toBe(true)
    expect(mainlineIds(study)).toContain(session.currentNodeId)
  })

  it('goTo jumps directly to a node', async () => {
    const session = await loaded()
    const target = mainlineIds(session.study!)[4]
    session.goTo(target)
    expect(session.currentNodeId).toBe(target)
    expect(session.currentFen).toBe(getNode(session.study!, target).fen)
  })

  it('flip toggles and persists orientation', async () => {
    const session = await loaded()
    expect(session.orientation).toBe('white')
    session.flip()
    expect(session.orientation).toBe('black')
    // a new pinia session restores the persisted orientation
    setActivePinia(createPinia())
    const fresh = useSessionStore()
    await fresh.loadStudy('fixture-italian')
    expect(fresh.orientation).toBe('black')
  })

  it('remembers the last position per study and restores it', async () => {
    const session = await loaded()
    session.next()
    session.next()
    const nodeId = session.currentNodeId
    setActivePinia(createPinia())
    const fresh = useSessionStore()
    await fresh.loadStudy('fixture-italian')
    expect(fresh.currentNodeId).toBe(nodeId)
  })
})

describe('sessionStore: review fixes', () => {
  it('keeps following a selected variation after stepping back through the branch point', async () => {
    const session = await loaded()
    for (let i = 0; i < 5; i++) session.next() // position after 3. Bc4
    const nf6 = session.variations[0]
    session.selectVariation(nf6.id)
    session.previous() // back to the branch point
    session.next() // must re-enter the selected variation, not the main line
    expect(session.currentNodeId).toBe(nf6.id)
    session.returnToMainLine()
    session.next() // selection cleared: main line again
    expect(session.currentNode?.moveFromParent?.san).toBe('Bc5')
  })

  it('sets a friendly error when the repository fails', async () => {
    provideRepository({
      list: async () => [],
      get: async () => {
        throw new Error('idb exploded')
      },
      save: async () => {},
      delete: async () => {},
    })
    const session = useSessionStore()
    await session.loadStudy('fixture-italian')
    expect(session.error).toMatch(/could not/i)
    expect(session.study).toBeNull()
  })

  it('ignores a stale load that resolves after a newer one', async () => {
    const slow = branchingStudy('slow-study')
    const fast = branchingStudy('fast-study')
    let releaseSlow!: () => void
    const gate = new Promise<void>((resolve) => (releaseSlow = resolve))
    provideRepository({
      list: async () => [],
      get: async (id) => {
        if (id === 'slow-study') {
          await gate
          return slow
        }
        return fast
      },
      save: async () => {},
      delete: async () => {},
    })
    const session = useSessionStore()
    const slowLoad = session.loadStudy('slow-study')
    await session.loadStudy('fast-study')
    releaseSlow()
    await slowLoad
    expect(session.study?.id).toBe('fast-study')
  })

  it('restores the last position via SAN path even when node ids shift', async () => {
    const session = await loaded()
    session.next()
    session.next() // after 1... e5
    const editedStudy = branchingStudy('fixture-italian')
    // simulate a content edit that regenerates/renames every node id
    const renamed = Object.fromEntries(
      Object.entries(editedStudy.nodes).map(([id, node]) => [
        `x-${id}`,
        {
          ...node,
          id: `x-${id}`,
          parentId: node.parentId ? `x-${node.parentId}` : undefined,
          children: node.children.map((c) => `x-${c}`),
          preferredChildId: node.preferredChildId ? `x-${node.preferredChildId}` : undefined,
        },
      ]),
    )
    editedStudy.nodes = renamed
    editedStudy.rootNodeId = 'x-n0'
    provideRepository(createBundledRepository([editedStudy]))
    setActivePinia(createPinia())
    const fresh = useSessionStore()
    await fresh.loadStudy('fixture-italian')
    expect(fresh.currentNode?.moveFromParent?.san).toBe('e5')
  })
})
