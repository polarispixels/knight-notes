<script setup lang="ts">
defineProps<{ orientation: 'white' | 'black' }>()
defineEmits<{ flip: [] }>()
</script>

<template>
  <div class="board-controls">
    <button class="btn" data-test="flip-board" title="Flip board (F)" @click="$emit('flip')">
      ⇅ Flip board
    </button>
    <span class="orientation">{{ orientation === 'white' ? 'White' : 'Black' }} at bottom</span>
  </div>
</template>

<style scoped>
.board-controls {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}
.orientation {
  font-size: 0.8rem;
  color: var(--ink-soft);
}
</style>
