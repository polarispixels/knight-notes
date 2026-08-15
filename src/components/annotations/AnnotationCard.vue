<script setup lang="ts">
import type { Annotation } from '../../domain/study/types'

defineProps<{ annotation: Annotation }>()

const TYPE_LABELS: Record<string, string> = {
  commentary: 'Commentary',
  question: 'Before you continue',
  'key-idea': 'Key idea',
  'critical-position': 'Critical position',
  principle: 'Principle',
  warning: 'Warning',
  historical: 'Historical note',
  mistake: 'Mistake',
  strategy: 'Strategy',
  tactic: 'Tactic',
}
</script>

<template>
  <article class="annotation" :class="`type-${annotation.type}`">
    <header class="annotation-head">
      <span class="annotation-type">{{ TYPE_LABELS[annotation.type] ?? annotation.type }}</span>
      <span v-if="annotation.title" class="annotation-title">{{ annotation.title }}</span>
    </header>
    <p class="annotation-body">{{ annotation.body }}</p>
  </article>
</template>

<style scoped>
.annotation {
  border-left: 3px solid var(--accent);
  background: var(--surface);
  border-radius: 0 var(--radius) var(--radius) 0;
  padding: 0.65rem 0.9rem;
}
.annotation.type-warning,
.annotation.type-mistake {
  border-left-color: var(--danger);
}
.annotation.type-key-idea,
.annotation.type-critical-position {
  border-left-color: var(--good);
}
.annotation.type-question .annotation-body {
  font-style: italic;
}
.annotation-head {
  display: flex;
  align-items: baseline;
  gap: 0.55rem;
  margin-bottom: 0.2rem;
}
.annotation-type {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--ink-soft);
}
.annotation-title {
  font-family: var(--font-serif);
  font-weight: 700;
  font-size: 0.98rem;
}
.annotation-body {
  margin: 0;
  font-family: var(--font-serif);
  font-size: 1.02rem;
  line-height: 1.6;
}
</style>
