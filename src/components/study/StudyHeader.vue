<script setup lang="ts">
import type { Study } from '../../domain/study/types'

defineProps<{ study: Study }>()
</script>

<template>
  <header class="study-header">
    <h2 class="study-title">{{ study.title }}</h2>
    <p v-if="study.subtitle" class="study-subtitle">{{ study.subtitle }}</p>
    <p v-if="study.metadata?.white && study.metadata?.black" class="study-players">
      {{ study.metadata.white }} – {{ study.metadata.black }}
      <template v-if="study.metadata.event">, {{ study.metadata.event }}</template>
      <template v-if="study.metadata.date"> ({{ study.metadata.date.slice(0, 4) }})</template>
      <template v-if="study.metadata.result"> · {{ study.metadata.result }}</template>
    </p>
    <p v-if="study.summary" class="study-summary">{{ study.summary }}</p>
  </header>
</template>

<style scoped>
.study-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.study-title {
  font-size: 1.45rem;
}
.study-subtitle,
.study-players {
  margin: 0;
  font-size: 0.86rem;
  color: var(--ink-soft);
}
.study-summary {
  margin: 0.35rem 0 0;
  font-family: var(--font-serif);
  font-size: 0.98rem;
  line-height: 1.55;
}
</style>
