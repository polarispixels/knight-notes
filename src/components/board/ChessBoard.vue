<script setup lang="ts">
import { computed } from 'vue'
import type { VisualAnnotation } from '../../domain/study/types'

const props = withDefaults(
  defineProps<{
    fen: string
    orientation: 'white' | 'black'
    lastMove?: { from: string; to: string } | null
    highlights?: VisualAnnotation[]
  }>(),
  { lastMove: null, highlights: () => [] },
)

const baseUrl = import.meta.env.BASE_URL ?? '/'

const FILES = 'abcdefgh'
const PIECE_FILES: Record<string, string> = {
  K: 'kl', Q: 'ql', R: 'rl', B: 'bl', N: 'nl', P: 'pl',
  k: 'kd', q: 'qd', r: 'rd', b: 'bd', n: 'nd', p: 'pd',
}

/** Board coordinates for a square like "e4", honoring orientation. */
function toXY(square: string): { x: number; y: number } {
  const file = FILES.indexOf(square[0])
  const rank = parseInt(square[1], 10)
  return props.orientation === 'white'
    ? { x: file, y: 8 - rank }
    : { x: 7 - file, y: rank - 1 }
}

const pieces = computed(() => {
  const placement = props.fen.split(' ')[0] ?? ''
  const result: { square: string; piece: string; x: number; y: number }[] = []
  const ranks = placement.split('/')
  for (let r = 0; r < ranks.length; r++) {
    let file = 0
    for (const ch of ranks[r]) {
      if (/\d/.test(ch)) {
        file += parseInt(ch, 10)
      } else {
        const square = `${FILES[file]}${8 - r}`
        const { x, y } = toXY(square)
        result.push({ square, piece: PIECE_FILES[ch], x, y })
        file++
      }
    }
  }
  return result
})

const squares = computed(() => {
  const result: { x: number; y: number; dark: boolean }[] = []
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      result.push({ x, y, dark: (x + y) % 2 === 1 })
    }
  }
  return result
})

const lastMoveSquares = computed(() =>
  props.lastMove ? [toXY(props.lastMove.from), toXY(props.lastMove.to)] : [],
)

const squareHighlights = computed(() =>
  props.highlights
    .filter((h): h is Extract<VisualAnnotation, { type: 'square' }> => h.type === 'square')
    .map((h) => ({ ...toXY(h.square), style: h.style })),
)

const arrows = computed(() =>
  props.highlights
    .filter((h): h is Extract<VisualAnnotation, { type: 'arrow' }> => h.type === 'arrow')
    .map((h) => {
      const from = toXY(h.from)
      const to = toXY(h.to)
      return {
        x1: from.x + 0.5, y1: from.y + 0.5,
        x2: to.x + 0.5, y2: to.y + 0.5,
        style: h.style,
      }
    }),
)

/** Edge coordinate labels (files along the bottom, ranks up the side). */
const fileLabels = computed(() =>
  Array.from({ length: 8 }, (_, i) => ({
    x: i,
    label: props.orientation === 'white' ? FILES[i] : FILES[7 - i],
  })),
)
const rankLabels = computed(() =>
  Array.from({ length: 8 }, (_, i) => ({
    y: i,
    label: props.orientation === 'white' ? String(8 - i) : String(i + 1),
  })),
)
</script>

<template>
  <svg class="chess-board" viewBox="0 0 8 8" role="img" aria-label="Chess board">
    <defs>
      <marker
        id="arrowhead"
        viewBox="0 0 10 10"
        refX="7"
        refY="5"
        markerWidth="4"
        markerHeight="4"
        orient="auto-start-reverse"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--board-arrow, #15803d)" />
      </marker>
    </defs>

    <rect
      v-for="s in squares"
      :key="`${s.x}-${s.y}`"
      class="square"
      :class="s.dark ? 'dark' : 'light'"
      :x="s.x"
      :y="s.y"
      width="1"
      height="1"
    />

    <rect
      v-for="(s, i) in lastMoveSquares"
      :key="`lm-${i}`"
      class="last-move"
      :x="s.x"
      :y="s.y"
      width="1"
      height="1"
    />

    <rect
      v-for="(s, i) in squareHighlights"
      :key="`hl-${i}`"
      class="highlight-square"
      :x="s.x + 0.04"
      :y="s.y + 0.04"
      width="0.92"
      height="0.92"
      rx="0.08"
    />

    <text
      v-for="f in fileLabels"
      :key="`f-${f.label}`"
      class="coord"
      :x="f.x + 0.82"
      :y="7.94"
      font-size="0.18"
    >
      {{ f.label }}
    </text>
    <text
      v-for="r in rankLabels"
      :key="`r-${r.label}`"
      class="coord"
      :x="0.06"
      :y="r.y + 0.24"
      font-size="0.18"
    >
      {{ r.label }}
    </text>

    <image
      v-for="p in pieces"
      :key="p.square"
      :href="`${baseUrl}pieces/${p.piece}.svg`"
      :x="p.x"
      :y="p.y"
      width="1"
      height="1"
    />

    <line
      v-for="(a, i) in arrows"
      :key="`ar-${i}`"
      class="annotation-arrow"
      :x1="a.x1"
      :y1="a.y1"
      :x2="a.x2"
      :y2="a.y2"
      stroke-width="0.13"
      marker-end="url(#arrowhead)"
    />
  </svg>
</template>

<style scoped>
.chess-board {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.18);
  user-select: none;
}
.square.light {
  fill: var(--board-light, #f0dcc0);
}
.square.dark {
  fill: var(--board-dark, #ab8563);
}
.last-move {
  fill: var(--board-last-move, rgba(205, 165, 60, 0.42));
}
.highlight-square {
  fill: none;
  stroke: var(--board-highlight, #b33a3a);
  stroke-width: 0.06;
}
.coord {
  fill: rgb(60 45 30 / 0.55);
  font-family: var(--font-ui, system-ui, sans-serif);
  pointer-events: none;
}
.annotation-arrow {
  stroke: var(--board-arrow, #15803d);
  opacity: 0.75;
}
</style>
