<script setup lang="ts">
import type { StudySummary } from '../../domain/study/types'

defineProps<{ study: StudySummary }>()
defineEmits<{ open: [] }>()

const TYPE_LABELS: Record<string, string> = {
  game: 'Game',
  opening: 'Opening',
  variation: 'Variation',
  gambit: 'Gambit',
  trap: 'Trap',
  tactic: 'Tactic',
  endgame: 'Endgame',
  pattern: 'Pattern',
  concept: 'Concept',
}
</script>

<template>
  <article class="study-card" data-test="study-card" @click="$emit('open')">
    <div class="card-top">
      <span class="chips">
        <span class="type-chip">{{ TYPE_LABELS[study.type] ?? study.type }}</span>
        <span v-if="study.focus" class="focus-badge" :class="study.focus" data-test="focus-badge">
          {{ study.focus === 'white' ? '♙ For White' : '♟ For Black' }}
        </span>
      </span>
      <span v-if="study.difficulty" class="difficulty">{{ study.difficulty }}</span>
    </div>
    <h3 class="card-title">{{ study.title }}</h3>
    <p v-if="study.subtitle" class="card-subtitle">{{ study.subtitle }}</p>
    <p v-if="study.summary" class="card-summary">{{ study.summary }}</p>
    <div class="card-meta">
      <span v-if="study.metadata?.white && study.metadata?.black" class="players">
        {{ study.metadata.white }} – {{ study.metadata.black }}
        <template v-if="study.metadata.date"> · {{ study.metadata.date.slice(0, 4) }}</template>
      </span>
      <span v-if="study.concepts.length" class="concepts">
        {{ study.concepts.slice(0, 3).join(' · ') }}
      </span>
      <span v-if="study.source === 'local'" class="imported">imported</span>
    </div>
  </article>
</template>

<style scoped>
.study-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 1rem 1.1rem;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  transition: border-color 120ms ease, box-shadow 120ms ease;
}
.study-card:hover {
  border-color: var(--accent);
  box-shadow: 0 2px 8px rgb(0 0 0 / 0.06);
}
.card-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.chips {
  display: flex;
  align-items: baseline;
  gap: 0.55rem;
}
.type-chip {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--accent);
}
.focus-badge {
  font-size: 0.72rem;
  color: var(--ink-soft);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 0.05rem 0.5rem;
}
.focus-badge.black {
  background: var(--ink);
  color: var(--paper);
  border-color: var(--ink);
}
.difficulty {
  font-size: 0.74rem;
  color: var(--ink-soft);
}
.card-title {
  font-size: 1.12rem;
}
.card-subtitle {
  margin: 0;
  font-size: 0.85rem;
  color: var(--ink-soft);
}
.card-summary {
  margin: 0.15rem 0 0;
  font-size: 0.88rem;
  color: var(--ink);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.card-meta {
  margin-top: 0.4rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  font-size: 0.76rem;
  color: var(--ink-soft);
}
.imported {
  color: var(--accent);
}
</style>
