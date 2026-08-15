<script setup lang="ts">
defineProps<{ canNext: boolean; canPrevious: boolean }>()
defineEmits<{ start: []; previous: []; next: []; end: [] }>()
</script>

<template>
  <div class="navigator" role="toolbar" aria-label="Move navigation">
    <button class="btn" data-test="nav-start" :disabled="!canPrevious" title="Beginning (Home)" @click="$emit('start')">
      «
    </button>
    <button class="btn" data-test="nav-previous" :disabled="!canPrevious" title="Previous (←)" @click="$emit('previous')">
      ← Previous
    </button>
    <button class="btn primary" data-test="nav-next" :disabled="!canNext" title="Next (→ or Space)" @click="$emit('next')">
      Next →
    </button>
    <button class="btn" data-test="nav-end" :disabled="!canNext" title="End (End)" @click="$emit('end')">
      »
    </button>
  </div>
</template>

<style scoped>
.navigator {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.navigator .primary {
  min-width: 7.5rem;
}
</style>
