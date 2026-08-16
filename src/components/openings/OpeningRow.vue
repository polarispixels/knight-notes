<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { OpeningNode } from '../../domain/openings/types'
import { useOpeningsStore } from '../../application/openings/openingsStore'

const props = defineProps<{ node: OpeningNode; depth: number }>()
const openings = useOpeningsStore()
const router = useRouter()

const children = computed(() =>
  props.node.children
    .map((id) => openings.nodeById(id))
    .filter((n): n is OpeningNode => !!n && openings.visibleIds.has(n.id)),
)

/** Where this row's lesson lives: its own study, or its parent's for
 *  branch-only names. */
const lessonTarget = computed(() => {
  if (props.node.lessonStatus === 'available') return props.node.lessonId
  if (props.node.tier === 'branch-only' && props.node.branchOfLessonId) {
    const owner = [...openings.nodes.values()].find(
      (n) => n.lessonId === props.node.branchOfLessonId && n.lessonStatus === 'available',
    )
    return owner?.lessonId
  }
  return undefined
})

function open() {
  if (lessonTarget.value) router.push(`/study/${lessonTarget.value}`)
}
</script>

<template>
  <li class="opening-row" :data-test="`opening-${node.id}`">
    <div
      class="row-line"
      :class="{ clickable: !!lessonTarget, branch: node.tier === 'branch-only' }"
      :style="{ paddingLeft: `${depth * 1.1}rem` }"
      @click="open"
    >
      <span class="row-name">{{ node.canonicalName }}</span>
      <span v-if="node.eco?.length" class="row-eco">{{ node.eco[0] }}</span>
      <span v-if="node.side !== 'both'" class="row-side" :class="node.side">
        {{ node.side === 'white' ? '♙' : '♟' }}
      </span>
      <span v-if="node.tier === 'branch-only'" class="row-status branch-label">
        in parent lesson
      </span>
      <span v-else-if="node.lessonStatus === 'available'" class="row-status available">
        Lesson →
      </span>
      <span v-else class="row-status planned">Coming soon</span>
    </div>
    <ul v-if="children.length" class="row-children">
      <OpeningRow v-for="child in children" :key="child.id" :node="child" :depth="depth + 1" />
    </ul>
  </li>
</template>

<style scoped>
.opening-row {
  list-style: none;
}
.row-line {
  display: flex;
  align-items: baseline;
  gap: 0.55rem;
  padding: 0.34rem 0.5rem;
  border-radius: 6px;
}
.row-line.clickable {
  cursor: pointer;
}
.row-line.clickable:hover {
  background: var(--accent-soft);
}
.row-name {
  color: var(--ink);
  font-size: 0.95rem;
}
.branch .row-name {
  color: var(--ink-soft);
  font-size: 0.88rem;
}
.row-eco {
  font-size: 0.72rem;
  color: var(--ink-soft);
  font-variant-numeric: tabular-nums;
}
.row-side {
  font-size: 0.8rem;
}
.row-status {
  margin-left: auto;
  font-size: 0.74rem;
  white-space: nowrap;
}
.row-status.available {
  color: var(--accent);
}
.row-status.planned,
.row-status.branch-label {
  color: var(--ink-soft);
  opacity: 0.75;
}
.row-children {
  margin: 0;
  padding: 0;
}
</style>
