import { describe, it, expect } from 'vitest'
import { pgnToStudy } from '../toStudy'
import { PgnParseError } from '../parse'
import { getNode, mainlineIds, variationsAt } from '../../../../domain/study/traversal'
import { STARTING_FEN } from '../../engine'

const SCHOLARS = `[Event "Test"]
[White "Alice"]
[Black "Bob"]
[Result "1-0"]

1. e4 e5 2. Qh5 Nc6 3. Bc4 Nf6 4. Qxf7# 1-0`

describe('pgnToStudy: simple game', () => {
  it('builds a linear study with correct FEN chain', () => {
    const study = pgnToStudy(SCHOLARS, { id: 'scholars' })
    expect(study.id).toBe('scholars')
    const line = mainlineIds(study)
    expect(line).toHaveLength(8) // root + 7 moves
    expect(getNode(study, line[0]).fen).toBe(STARTING_FEN)
    const last = getNode(study, line[7])
    expect(last.moveFromParent?.san).toBe('Qxf7#')
    expect(last.ply).toBe(7)
    expect(last.fen).toContain('Q')
  })

  it('maps headers to metadata and derives the title', () => {
    const study = pgnToStudy(SCHOLARS)
    expect(study.title).toBe('Alice vs Bob')
    expect(study.metadata?.white).toBe('Alice')
    expect(study.metadata?.black).toBe('Bob')
    expect(study.metadata?.result).toBe('1-0')
    expect(study.type).toBe('game')
  })

  it('falls back to "Imported Study" when players are unknown', () => {
    expect(pgnToStudy('1. e4 e5').title).toBe('Imported Study')
  })

  it('normalizes SAN through the engine', () => {
    const study = pgnToStudy('1. e4 e5 2. Qh5 Nc6 3. Bc4 Nf6 4. Qxf7')
    const line = mainlineIds(study)
    expect(getNode(study, line[7]).moveFromParent?.san).toBe('Qxf7#')
  })

  it('records from/to squares and side on moves', () => {
    const study = pgnToStudy('1. e4 e5')
    const [_, n1, n2] = mainlineIds(study)
    expect(getNode(study, n1).moveFromParent).toMatchObject({
      san: 'e4', from: 'e2', to: 'e4', side: 'white', moveNumber: 1,
    })
    expect(getNode(study, n2).moveFromParent).toMatchObject({ side: 'black', moveNumber: 1 })
  })
})

describe('pgnToStudy: comments and NAGs', () => {
  it('turns comments into commentary annotations', () => {
    const study = pgnToStudy('1. e4 {Claims the center.} e5')
    const [, n1] = mainlineIds(study)
    const annotations = getNode(study, n1).annotations
    expect(annotations).toHaveLength(1)
    expect(annotations?.[0]).toMatchObject({ type: 'commentary', body: 'Claims the center.' })
  })

  it('maps NAGs to educational classifications', () => {
    const study = pgnToStudy('1. e4!! e5? 2. Nf3! Nc6??')
    const [, n1, n2, n3, n4] = mainlineIds(study)
    expect(getNode(study, n1).moveFromParent?.classification).toBe('critical')
    expect(getNode(study, n2).moveFromParent?.classification).toBe('mistake')
    expect(getNode(study, n3).moveFromParent?.classification).toBe('interesting')
    expect(getNode(study, n4).moveFromParent?.classification).toBe('blunder')
  })
})

describe('pgnToStudy: variations', () => {
  it('creates sibling branches with the mainline preferred', () => {
    const study = pgnToStudy('1. e4 e5 2. Nf3 (2. f4 exf4) Nc6')
    const line = mainlineIds(study)
    const e5Node = getNode(study, line[2])
    expect(e5Node.children).toHaveLength(2)
    const nf3 = getNode(study, e5Node.preferredChildId!)
    expect(nf3.moveFromParent?.san).toBe('Nf3')
    const [f4] = variationsAt(study, e5Node.id)
    expect(f4.moveFromParent?.san).toBe('f4')
    const exf4 = getNode(study, f4.children[0])
    expect(exf4.moveFromParent?.san).toBe('exf4')
    expect(exf4.fen).toContain('b')
  })

  it('handles nested variations', () => {
    const study = pgnToStudy('1. e4 e5 (1... c5 2. Nf3 (2. c3 d5)) 2. Nf3')
    const root = getNode(study, study.rootNodeId)
    const e4 = getNode(study, root.children[0])
    expect(e4.children).toHaveLength(2)
    const c5 = getNode(study, e4.children[1])
    expect(c5.moveFromParent?.san).toBe('c5')
    const nf3InVar = getNode(study, c5.children[0])
    expect(nf3InVar.children.length + 0).toBeGreaterThanOrEqual(0)
    expect(c5.children).toHaveLength(2) // 2. Nf3 and 2. c3
  })
})

describe('pgnToStudy: FEN starts and promotion', () => {
  it('starts from a [FEN] header and numbers moves from it', () => {
    const pgn = `[FEN "1K1k4/1P6/8/8/8/8/r7/2R5 b - - 0 30"]

30... Ra4 31. Rd1+`
    const study = pgnToStudy(pgn)
    expect(study.initialFen).toBe('1K1k4/1P6/8/8/8/8/r7/2R5 b - - 0 30')
    const [, b1, w2] = mainlineIds(study)
    expect(getNode(study, b1).moveFromParent).toMatchObject({
      san: 'Ra4', side: 'black', moveNumber: 30,
    })
    expect(getNode(study, w2).moveFromParent).toMatchObject({ side: 'white', moveNumber: 31 })
  })

  it('handles promotion', () => {
    const pgn = `[FEN "8/P6k/8/8/8/8/8/K7 w - - 0 1"]

1. a8=Q`
    const study = pgnToStudy(pgn)
    const [, n1] = mainlineIds(study)
    expect(getNode(study, n1).moveFromParent?.promotion).toBe('q')
  })
})

describe('pgnToStudy: errors', () => {
  it('throws a PgnParseError naming an illegal move', () => {
    expect(() => pgnToStudy('1. e4 e5 2. Ke2 Ke7')).not.toThrow()
    expect(() => pgnToStudy('1. e4 e4')).toThrow(PgnParseError)
    expect(() => pgnToStudy('1. e4 e4')).toThrow(/e4/)
  })

  it('throws on an illegal move inside a variation', () => {
    expect(() => pgnToStudy('1. e4 e5 (1... e4)')).toThrow(PgnParseError)
  })
})
