import { describe, it, expect } from 'vitest'
import { parsePgn, PgnParseError } from '../parse'

describe('parsePgn: headers', () => {
  it('parses tag pairs', () => {
    const pgn = `[Event "Casual Game"]
[White "Anderssen"]
[Black "Kieseritzky"]

1. e4 e5 *`
    const parsed = parsePgn(pgn)
    expect(parsed.headers.Event).toBe('Casual Game')
    expect(parsed.headers.White).toBe('Anderssen')
    expect(parsed.headers.Black).toBe('Kieseritzky')
  })

  it('handles escaped quotes in header values', () => {
    const parsed = parsePgn(`[Event "The \\"Immortal\\" Game"]\n\n1. e4 *`)
    expect(parsed.headers.Event).toBe('The "Immortal" Game')
  })
})

describe('parsePgn: movetext', () => {
  it('parses a simple main line', () => {
    const parsed = parsePgn('1. e4 e5 2. Nf3 Nc6 3. Bb5 a6')
    expect(parsed.moves.map((m) => m.san)).toEqual(['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6'])
  })

  it('parses castling, captures, checks and mate suffixes', () => {
    const parsed = parsePgn('1. e4 e5 2. Qh5 Nc6 3. Bc4 Nf6 4. Qxf7# 1-0')
    expect(parsed.moves.map((m) => m.san)).toEqual(['e4', 'e5', 'Qh5', 'Nc6', 'Bc4', 'Nf6', 'Qxf7#'])
    expect(parsed.result).toBe('1-0')
  })

  it('parses O-O and O-O-O and promotions', () => {
    const parsed = parsePgn('1. O-O O-O-O 2. e8=Q+ b1=N *')
    expect(parsed.moves.map((m) => m.san)).toEqual(['O-O', 'O-O-O', 'e8=Q+', 'b1=N'])
  })

  it('ignores move numbers and black ellipses', () => {
    const parsed = parsePgn('1.e4 1... e5 2 . Nf3')
    expect(parsed.moves.map((m) => m.san)).toEqual(['e4', 'e5', 'Nf3'])
  })
})

describe('parsePgn: comments and NAGs', () => {
  it('attaches brace comments to the preceding move', () => {
    const parsed = parsePgn('1. e4 {Best by test.} e5 {Symmetry.}')
    expect(parsed.moves[0].comments).toEqual(['Best by test.'])
    expect(parsed.moves[1].comments).toEqual(['Symmetry.'])
  })

  it('attaches a leading comment to the following move', () => {
    const parsed = parsePgn('{The game begins.} 1. e4')
    expect(parsed.moves[0].comments).toEqual(['The game begins.'])
  })

  it('parses numeric and suffix NAGs', () => {
    const parsed = parsePgn('1. e4 $1 e5?? 2. Nf3! Nc6?!')
    expect(parsed.moves[0].nags).toEqual([1])
    expect(parsed.moves[1].nags).toEqual([4])
    expect(parsed.moves[2].nags).toEqual([1])
    expect(parsed.moves[3].nags).toEqual([6])
  })

  it('ignores semicolon rest-of-line comments', () => {
    const parsed = parsePgn('1. e4 e5 ; king pawn game\n2. Nf3')
    expect(parsed.moves.map((m) => m.san)).toEqual(['e4', 'e5', 'Nf3'])
  })
})

describe('parsePgn: variations', () => {
  it('attaches a variation to the move it replaces', () => {
    const parsed = parsePgn('1. e4 e5 2. Nf3 (2. f4 exf4) 2... Nc6')
    expect(parsed.moves.map((m) => m.san)).toEqual(['e4', 'e5', 'Nf3', 'Nc6'])
    const nf3 = parsed.moves[2]
    expect(nf3.variations).toHaveLength(1)
    expect(nf3.variations[0].map((m) => m.san)).toEqual(['f4', 'exf4'])
  })

  it('parses nested variations', () => {
    const parsed = parsePgn('1. e4 e5 (1... c5 2. Nf3 (2. c3 d5)) 2. Nf3')
    const e5 = parsed.moves[1]
    expect(e5.variations[0].map((m) => m.san)).toEqual(['c5', 'Nf3'])
    expect(e5.variations[0][1].variations[0].map((m) => m.san)).toEqual(['c3', 'd5'])
  })

  it('supports multiple variations on one move', () => {
    const parsed = parsePgn('1. e4 e5 2. Nf3 Nc6 (2... Nf6) (2... d6) 3. Bb5')
    expect(parsed.moves[3].variations).toHaveLength(2)
  })

  it('parses comments inside variations', () => {
    const parsed = parsePgn('1. e4 e5 (1... c5 {The Sicilian.})')
    expect(parsed.moves[1].variations[0][0].comments).toEqual(['The Sicilian.'])
  })
})

describe('parsePgn: errors', () => {
  it('throws on an unterminated comment', () => {
    expect(() => parsePgn('1. e4 {oops')).toThrow(PgnParseError)
  })
  it('throws on unbalanced variation parens', () => {
    expect(() => parsePgn('1. e4 e5 (1... c5')).toThrow(PgnParseError)
  })
  it('throws on a variation with no preceding move', () => {
    expect(() => parsePgn('(1. e4)')).toThrow(PgnParseError)
  })
  it('throws on garbage tokens', () => {
    expect(() => parsePgn('1. e4 e5 2. Zz9')).toThrow(PgnParseError)
  })
  it('throws on empty input', () => {
    expect(() => parsePgn('   ')).toThrow(PgnParseError)
  })
})
