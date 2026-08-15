import { describe, it, expect } from 'vitest'
import { createEngine, STARTING_FEN } from '../engine'

describe('createEngine', () => {
  it('starts from the standard position by default', () => {
    expect(createEngine().fen()).toBe(STARTING_FEN)
  })

  it('starts from a given FEN', () => {
    const lucena = '1K1k4/1P6/8/8/8/8/r7/2R5 w - - 0 1'
    expect(createEngine(lucena).fen()).toBe(lucena)
  })

  it('plays a legal SAN move and reports detail', () => {
    const engine = createEngine()
    const detail = engine.move('e4')
    expect(detail).toEqual({ san: 'e4', from: 'e2', to: 'e4', side: 'white' })
    expect(engine.fen()).toContain('rnbqkbnr/pppppppp/8/8/4P3')
  })

  it('returns null for an illegal move without changing the position', () => {
    const engine = createEngine()
    expect(engine.move('Ke2')).toBeNull()
    expect(engine.fen()).toBe(STARTING_FEN)
  })

  it('reports promotion detail', () => {
    const engine = createEngine('8/P6k/8/8/8/8/8/K7 w - - 0 1')
    const detail = engine.move('a8=Q')
    expect(detail?.promotion).toBe('q')
    expect(detail?.san).toBe('a8=Q')
  })

  it('normalizes sloppy SAN to canonical form', () => {
    const engine = createEngine()
    engine.move('e4')
    engine.move('e5')
    engine.move('Bc4')
    engine.move('Bc5')
    engine.move('Qh5')
    engine.move('Nf6')
    const mate = engine.move('Qxf7')
    expect(mate?.san).toBe('Qxf7#')
  })

  it('tracks turn and move number', () => {
    const engine = createEngine()
    expect(engine.turn()).toBe('white')
    expect(engine.moveNumber()).toBe(1)
    engine.move('e4')
    expect(engine.turn()).toBe('black')
    engine.move('e5')
    expect(engine.moveNumber()).toBe(2)
  })
})
