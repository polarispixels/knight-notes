<script setup lang="ts">
import type { StudyNode } from '../../domain/study/types'
import { moveLabel } from '../../domain/study/traversal'

defineProps<{ variations: StudyNode[]; onMainLine: boolean }>()
defineEmits<{ select: [nodeId: string]; returnToMainLine: [] }>()

function label(node: StudyNode): string {
  return moveLabel(node) ?? ''
}

function description(node: StudyNode): string | null {
  const first = node.annotations?.[0]
  if (!first) return null
  return first.title ?? (first.body.length > 90 ? `${first.body.slice(0, 87)}…` : first.body)
}
</script>

<template>
  <div v-if="variations.length || !onMainLine" class="variations">
    <template v-if="variations.length">
      <h4 class="variations-title">Alternative lines from this position</h4>
      <button
        v-for="variation in variations"
        :key="variation.id"
        class="variation"
        data-test="variation-option"
        @click="$emit('select', variation.id)"
      >
        <span class="variation-move">{{ label(variation) }}</span>
        <span v-if="description(variation)" class="variation-desc">{{ description(variation) }}</span>
      </button>
    </template>
    <button
      v-if="!onMainLine"
      class="btn return"
      data-test="return-mainline"
      @click="$emit('returnToMainLine')"
    >
      ↩ Return to main line
    </button>
  </div>
</template>

<style scoped>
.variations {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}
.variations-title {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-soft);
  margin: 0;
  font-family: var(--font-ui);
  font-weight: 600;
}
.variation {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.12rem;
  background: var(--surface);
  border: 1px dashed var(--line);
  border-radius: var(--radius);
  padding: 0.5rem 0.75rem;
  text-align: left;
}
.variation:hover {
  border-color: var(--accent);
}
.variation-move {
  font-weight: 700;
  font-size: 0.98rem;
}
.variation-desc {
  font-size: 0.84rem;
  color: var(--ink-soft);
}
.return {
  align-self: flex-start;
}
</style>
