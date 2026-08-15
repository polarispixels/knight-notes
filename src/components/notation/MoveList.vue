<script setup lang="ts">
import { computed } from 'vue'
import type { Study } from '../../domain/study/types'
import { getNode, moveRows } from '../../domain/study/traversal'

const props = defineProps<{
  study: Study
  lineIds: string[]
  currentNodeId: string
}>()
const emit = defineEmits<{ select: [nodeId: string] }>()

const rows = computed(() => moveRows(props.study, props.lineIds))

function moveClass(nodeId: string | undefined) {
  if (!nodeId) return {}
  const node = getNode(props.study, nodeId)
  const move = node.moveFromParent
  return {
    current: nodeId === props.currentNodeId,
    mistake: move?.classification === 'mistake' || move?.classification === 'blunder',
    important: move?.importance === 'important' || move?.importance === 'critical',
    branch: node.parentId !== undefined && getNode(props.study, node.parentId).children.length > 1,
  }
}

function san(nodeId: string) {
  return getNode(props.study, nodeId).moveFromParent?.san ?? ''
}
</script>

<template>
  <div class="move-list" aria-label="Move list">
    <div v-for="(row, i) in rows" :key="i" class="row">
      <span class="number">{{ row.number }}.</span>
      <button
        v-if="row.whiteNodeId"
        class="move"
        data-test="move"
        :class="moveClass(row.whiteNodeId)"
        @click="emit('select', row.whiteNodeId!)"
      >
        {{ san(row.whiteNodeId) }}
      </button>
      <span v-else class="move ellipsis">…</span>
      <button
        v-if="row.blackNodeId"
        class="move"
        data-test="move"
        :class="moveClass(row.blackNodeId)"
        @click="emit('select', row.blackNodeId!)"
      >
        {{ san(row.blackNodeId) }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.move-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.1rem 0.55rem;
  font-size: 0.95rem;
  line-height: 1.9;
}
.row {
  display: inline-flex;
  align-items: baseline;
  gap: 0.28rem;
}
.number {
  color: var(--ink-soft);
  font-size: 0.82rem;
}
.move {
  background: none;
  border: none;
  border-radius: 4px;
  padding: 0 0.28rem;
  font-family: var(--font-ui);
  font-size: 0.95rem;
  color: var(--ink);
}
.move:hover {
  background: var(--accent-soft);
}
.move.current {
  background: var(--accent);
  color: #fff;
}
.move.important {
  font-weight: 700;
}
.move.mistake {
  color: var(--danger);
}
.move.mistake.current {
  color: #fff;
  background: var(--danger);
}
.move.branch::after {
  content: '⋯';
  font-size: 0.7rem;
  vertical-align: super;
  color: var(--accent);
  margin-left: 0.08rem;
}
.ellipsis {
  color: var(--ink-soft);
}
</style>
