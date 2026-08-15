<script setup lang="ts">
import { computed } from 'vue'
import type { StudyNode } from '../../domain/study/types'

const props = defineProps<{ node: StudyNode | null }>()

const CLASSIFICATION_LABELS: Record<string, string> = {
  interesting: 'Interesting',
  critical: 'Critical moment',
  theory: 'Theory',
  forced: 'Forced',
  mistake: 'Mistake',
  blunder: 'Blunder',
  sacrifice: 'Sacrifice',
  novelty: 'Novelty',
}

const display = computed(() => {
  const move = props.node?.moveFromParent
  if (!move) return null
  const number = move.moveNumber ?? Math.ceil((props.node!.ply ?? 1) / 2)
  return {
    text: `${number}${move.side === 'black' ? '…' : '.'} ${move.san}`,
    classification: move.classification && move.classification !== 'normal'
      ? CLASSIFICATION_LABELS[move.classification]
      : null,
    negative: move.classification === 'mistake' || move.classification === 'blunder',
  }
})
</script>

<template>
  <div class="current-move">
    <span v-if="display" class="move-text">{{ display.text }}</span>
    <span v-else class="move-text start">Start position</span>
    <span
      v-if="display?.classification"
      class="classification"
      :class="{ negative: display.negative }"
    >
      {{ display.classification }}
    </span>
  </div>
</template>

<style scoped>
.current-move {
  display: flex;
  align-items: baseline;
  gap: 0.7rem;
}
.move-text {
  font-family: var(--font-serif);
  font-size: 1.65rem;
  font-weight: 700;
}
.move-text.start {
  color: var(--ink-soft);
  font-weight: 400;
  font-size: 1.2rem;
}
.classification {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--accent);
}
.classification.negative {
  color: var(--danger);
}
</style>
