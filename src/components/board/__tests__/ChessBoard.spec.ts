import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ChessBoard from '../ChessBoard.vue'
import { STARTING_FEN } from '../../../infrastructure/chess/engine'

const AFTER_E4 = 'rnbqkbnr/pppppppp/8/8/4P3/8/8/RNBQKBNR w KQkq - 0 1'

function pieceAt(wrapper: ReturnType<typeof mount>, x: number, y: number) {
  return wrapper
    .findAll('image')
    .find((img) => img.attributes('x') === String(x) && img.attributes('y') === String(y))
}

describe('ChessBoard', () => {
  it('renders all 32 pieces of the starting position', () => {
    const wrapper = mount(ChessBoard, {
      props: { fen: STARTING_FEN, orientation: 'white' },
    })
    expect(wrapper.findAll('image')).toHaveLength(32)
    expect(wrapper.findAll('rect.square')).toHaveLength(64)
  })

  it('places pieces by square with white at the bottom', () => {
    const wrapper = mount(ChessBoard, {
      props: { fen: AFTER_E4, orientation: 'white' },
    })
    // e4 = file e (4), rank 4 → x=4, y=4 with white at bottom
    const img = pieceAt(wrapper, 4, 4)
    expect(img?.attributes('href')).toContain('pl.svg')
  })

  it('mirrors coordinates when black is at the bottom', () => {
    const wrapper = mount(ChessBoard, {
      props: { fen: AFTER_E4, orientation: 'black' },
    })
    // e4 from black's view → x = 7-4 = 3, y = rank-1 = 3
    const img = pieceAt(wrapper, 3, 3)
    expect(img?.attributes('href')).toContain('pl.svg')
  })

  it('marks the last move squares', () => {
    const wrapper = mount(ChessBoard, {
      props: {
        fen: AFTER_E4,
        orientation: 'white',
        lastMove: { from: 'e2', to: 'e4' },
      },
    })
    expect(wrapper.findAll('rect.last-move')).toHaveLength(2)
  })

  it('renders square highlights and arrows from visual annotations', () => {
    const wrapper = mount(ChessBoard, {
      props: {
        fen: AFTER_E4,
        orientation: 'white',
        highlights: [
          { type: 'square', square: 'f7' },
          { type: 'arrow', from: 'c4', to: 'f7' },
        ],
      },
    })
    expect(wrapper.findAll('.highlight-square')).toHaveLength(1)
    expect(wrapper.findAll('line.annotation-arrow')).toHaveLength(1)
  })
})
