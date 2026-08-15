/**
 * App-owned boundary around the chess rules library (chess.js).
 * Nothing outside src/infrastructure/chess may import chess.js directly.
 */
import { Chess } from 'chess.js'
import type { Side } from '../../domain/study/types'

export const STARTING_FEN =
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

export interface MoveDetail {
  san: string
  from: string
  to: string
  promotion?: string
  side: Side
}

export interface ChessEngine {
  fen(): string
  /** Play a SAN move; returns normalized detail, or null if illegal. */
  move(san: string): MoveDetail | null
  turn(): Side
  moveNumber(): number
}

export function createEngine(fen: string = STARTING_FEN): ChessEngine {
  const chess = new Chess(fen)
  return {
    fen: () => chess.fen(),
    move(san: string): MoveDetail | null {
      try {
        const result = chess.move(san)
        const detail: MoveDetail = {
          san: result.san,
          from: result.from,
          to: result.to,
          side: result.color === 'w' ? 'white' : 'black',
        }
        if (result.promotion) detail.promotion = result.promotion
        return detail
      } catch {
        return null
      }
    },
    turn: () => (chess.turn() === 'w' ? 'white' : 'black'),
    moveNumber: () => chess.moveNumber(),
  }
}
