import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { branchingStudy } from '../../test/fixtures'
import { createBundledRepository } from '../../infrastructure/content/bundledStudyRepository'
import { provideRepository } from '../repositoryProvider'
import { useSessionStore } from '../session/sessionStore'
import { getNode, mainlineIds } from '../../domain/study/traversal'
import { STARTING_FEN } from '../../infrastructure/chess/engine'

describe('sessionStore', () => {
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
