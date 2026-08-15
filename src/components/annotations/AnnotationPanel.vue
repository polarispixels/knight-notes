<script setup lang="ts">
import type { Annotation } from '../../domain/study/types'
import AnnotationCard from './AnnotationCard.vue'

defineProps<{ annotations: Annotation[] }>()
</script>

<template>
  <div v-if="annotations.length" class="annotation-panel">
    <AnnotationCard v-for="a in annotations" :key="a.id" :annotation="a" />
  </div>
</template>

<style scoped>
.annotation-panel {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
</style>
