<script setup lang="ts">
import { CATEGORIES } from '../../application/library/categories'

defineProps<{ active: string }>()
defineEmits<{ select: [id: string] }>()
</script>

<template>
  <div class="filters" role="tablist" aria-label="Study categories">
    <button
      class="filter"
      :class="{ active: active === 'all' }"
      data-test="filter-all"
      @click="$emit('select', 'all')"
    >
      All
    </button>
    <button
      v-for="category in CATEGORIES"
      :key="category.id"
      class="filter"
      :class="{ active: active === category.id }"
      :data-test="`filter-${category.id}`"
      @click="$emit('select', category.id)"
    >
      {{ category.label }}
    </button>
  </div>
</template>

<style scoped>
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}
.filter {
  background: none;
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 0.32rem 0.85rem;
  font-size: 0.86rem;
  color: var(--ink-soft);
}
.filter:hover {
  border-color: var(--accent);
  color: var(--ink);
}
.filter.active {
  background: var(--accent-soft);
  border-color: var(--accent);
  color: var(--ink);
}
</style>
