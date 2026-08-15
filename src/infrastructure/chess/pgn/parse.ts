/**
 * Variation-aware PGN parser.
 * Produces a syntactic move tree; it does NOT validate chess legality —
 * that happens in toStudy.ts, where moves are replayed through the engine.
 */

export class PgnParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PgnParseError'
  }
}

export interface PgnMoveNode {
  san: string
  comments: string[]
  nags: number[]
  variations: PgnMoveNode[][]
}

export interface ParsedPgn {
  headers: Record<string, string>
  moves: PgnMoveNode[]
  result?: string
}

const HEADER_RE = /^\[(\w+)\s+"((?:[^"\\]|\\.)*)"\]\s*$/
const RESULT_RE = /^(1-0|0-1|1\/2-1\/2|\*)$/
const MOVE_NUMBER_RE = /^\d+\.*$/
const SAN_RE =
  /^(O-O-O|O-O|[KQRBN][a-h1-8]?[a-h1-8]?x?[a-h][1-8]|[a-h]x?[a-h]?[1-8](=[QRBN])?|[a-h][1-8](=[QRBN])?)[+#]?$/
const EVAL_TOKEN_RE = /^(\+-|-\+|\+\/?=|=\/?\+|=|∞|N|D|RR|TN)$/
const SUFFIX_NAGS: Record<string, number> = {
  '!': 1,
  '?': 2,
  '!!': 3,
  '??': 4,
  '!?': 5,
  '?!': 6,
}

type Token =
  | { kind: 'comment'; text: string }
  | { kind: 'lparen' }
  | { kind: 'rparen' }
  | { kind: 'nag'; value: number }
  | { kind: 'symbol'; text: string }

function tokenize(movetext: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  while (i < movetext.length) {
    const ch = movetext[i]
    if (/\s/.test(ch)) {
      i++
    } else if (ch === '{') {
      const end = movetext.indexOf('}', i + 1)
      if (end === -1) throw new PgnParseError('Unterminated { comment')
      tokens.push({ kind: 'comment', text: movetext.slice(i + 1, end).replace(/\s+/g, ' ').trim() })
      i = end + 1
    } else if (ch === ';') {
      const end = movetext.indexOf('\n', i)
      i = end === -1 ? movetext.length : end + 1
    } else if (ch === '(') {
      tokens.push({ kind: 'lparen' })
      i++
    } else if (ch === ')') {
      tokens.push({ kind: 'rparen' })
      i++
    } else if (ch === '$') {
      const match = /^\$(\d+)/.exec(movetext.slice(i))
      if (!match) throw new PgnParseError('Malformed NAG')
      tokens.push({ kind: 'nag', value: parseInt(match[1], 10) })
      i += match[0].length
    } else {
      const match = /^[^\s(){};]+/.exec(movetext.slice(i))!
      tokens.push({ kind: 'symbol', text: match[0] })
      i += match[0].length
    }
  }
  return tokens
}

function parseLine(tokens: Token[], pos: { i: number }, depth: number): PgnMoveNode[] {
  const line: PgnMoveNode[] = []
  const pendingComments: string[] = []

  while (pos.i < tokens.length) {
    const token = tokens[pos.i]
    if (token.kind === 'rparen') {
      if (depth === 0) throw new PgnParseError('Unbalanced ")" in movetext')
      return line
    }
    pos.i++

    if (token.kind === 'comment') {
      const last = line[line.length - 1]
      if (last) last.comments.push(token.text)
      else pendingComments.push(token.text)
    } else if (token.kind === 'nag') {
      const last = line[line.length - 1]
      if (last) last.nags.push(token.value)
    } else if (token.kind === 'lparen') {
      const last = line[line.length - 1]
      if (!last) throw new PgnParseError('Variation "(" with no preceding move')
      const variation = parseLine(tokens, pos, depth + 1)
      if (pos.i >= tokens.length || tokens[pos.i].kind !== 'rparen') {
        throw new PgnParseError('Unbalanced "(" in movetext')
      }
      pos.i++ // consume rparen
      last.variations.push(variation)
    } else if (token.kind === 'symbol') {
      const text = token.text
      if (RESULT_RE.test(text) || MOVE_NUMBER_RE.test(text) || text === '...' || text === '.') {
        continue
      }
      // Standalone evaluation glyphs some tools emit (+=, -+, ∞, N …).
      if (EVAL_TOKEN_RE.test(text)) continue
      // Handle glued move numbers like "1.e4" or "3...Nf6".
      let unglued = text.replace(/^\d+\.{1,3}/, '')
      if (unglued === '') continue
      // Normalize digit-zero castling ("0-0", "0-0-0") to letter-O SAN.
      if (/^0-0(-0)?[+#]?[!?]{0,2}$/.test(unglued)) unglued = unglued.replace(/0/g, 'O')
      // Split a trailing !/? suffix annotation off the SAN.
      const suffixMatch = /^(.*?)([!?]{1,2})$/.exec(unglued)
      const san = suffixMatch ? suffixMatch[1] : unglued
      const suffix = suffixMatch ? suffixMatch[2] : undefined
      if (!SAN_RE.test(san)) {
        throw new PgnParseError(`Unrecognized token "${text}" in movetext`)
      }
      const move: PgnMoveNode = {
        san,
        comments: pendingComments.splice(0),
        nags: suffix ? [SUFFIX_NAGS[suffix]] : [],
        variations: [],
      }
      line.push(move)
    }
  }

  if (depth > 0) throw new PgnParseError('Unbalanced "(" in movetext')
  return line
}

export function parsePgn(text: string): ParsedPgn {
  const headers: Record<string, string> = {}
  const lines = text.split('\n')
  let bodyStart = 0
  for (; bodyStart < lines.length; bodyStart++) {
    const line = lines[bodyStart].trim()
    if (line === '') continue
    const match = HEADER_RE.exec(line)
    if (!match) break
    headers[match[1]] = match[2].replace(/\\(["\\])/g, '$1')
  }

  const movetext = lines.slice(bodyStart).join('\n')
  const tokens = tokenize(movetext)
  const pos = { i: 0 }
  const moves = parseLine(tokens, pos, 0)
  if (pos.i < tokens.length) throw new PgnParseError('Unbalanced ")" in movetext')
  if (moves.length === 0) throw new PgnParseError('No moves found in PGN')

  const resultToken = [...tokens].reverse().find((t) => t.kind === 'symbol' && RESULT_RE.test(t.text))
  const result =
    headers.Result && RESULT_RE.test(headers.Result)
      ? headers.Result
      : resultToken && resultToken.kind === 'symbol'
        ? resultToken.text
        : undefined

  return { headers, moves, result }
}
