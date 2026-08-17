<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { OpeningNode } from '../../domain/openings/types'
import { useOpeningsStore } from '../../application/openings/openingsStore'

const props = defineProps<{ node: OpeningNode; depth: number }>()
const openings = useOpeningsStore()
const router = useRouter()

const isFamily = computed(() => props.depth === 0)
const isOpen = computed(() => !isFamily.value || openings.expanded.has(props.node.id))

const children = computed(() =>
  props.node.children
    .map((id) => openings.nodeById(id))
    .filter((n): n is OpeningNode => !!n && openings.visibleIds.has(n.id)),
)

const lessonCount = computed(() => openings.lessonCounts.get(props.node.id) ?? 0)

const TIER_CHIPS: Record<string, string> = {
  core: 'Core',
  major: 'Major',
  specialized: 'Specialized',
  historical: 'Historical',
}

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

function openLesson() {
  if (lessonTarget.value) router.push(`/study/${lessonTarget.value}`)
}

/** Family rows toggle on tap (big target); deeper rows open their lesson. */
function onRowClick() {
  if (isFamily.value && children.value.length > 0) openings.toggleExpanded(props.node.id)
  else openLesson()
}
</script>

<template>
  <li class="opening-row" :data-test="`opening-${node.id}`">
    <div
      class="row-line"
      :class="{
        clickable: !!lessonTarget || (isFamily && children.length > 0),
        branch: node.tier === 'branch-only',
        family: isFamily,
      }"
      :style="{ paddingLeft: isFamily ? undefined : `${depth * 1.1}rem` }"
      @click="onRowClick"
    >
      <span
        v-if="isFamily && children.length > 0"
        class="row-chevron"
        :class="{ open: isOpen }"
        aria-hidden="true"
        >›</span
      >
      <span class="row-name">{{ node.canonicalName }}</span>
      <span
        v-if="!isFamily && TIER_CHIPS[node.tier]"
        class="row-tier"
        :class="`tier-${node.tier}`"
        >{{ TIER_CHIPS[node.tier] }}</span
      >
      <span v-if="node.eco?.length" class="row-eco">{{ node.eco[0] }}</span>
      <span v-if="node.side !== 'both'" class="row-side" :class="node.side">
        {{ node.side === 'white' ? '♙' : '♟' }}
      </span>
      <span v-if="isFamily && !isOpen && children.length > 0" class="row-count">
        {{ lessonCount }} lesson{{ lessonCount === 1 ? '' : 's' }}
      </span>
      <button
        v-if="isFamily && node.lessonStatus === 'available'"
        class="row-lesson-chip"
        :data-test="`family-lesson-${node.id}`"
        @click.stop="openLesson"
      >
        Lesson →
      </button>
      <template v-else-if="!isFamily">
        <span v-if="node.tier === 'branch-only'" class="row-status branch-label">
          in parent lesson
        </span>
        <span v-else-if="node.lessonStatus === 'available'" class="row-status available">
          Lesson →
        </span>
        <span v-else class="row-status planned">Coming soon</span>
      </template>
    </div>
    <ul v-if="children.length && isOpen" class="row-children">
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
  padding: 0.42rem 0.5rem;
  border-radius: 6px;
}
.row-line.family {
  padding: 0.55rem 0.5rem;
}
.row-line.clickable {
  cursor: pointer;
}
.row-line.clickable:hover {
  background: var(--accent-soft);
}
.row-chevron {
  align-self: center;
  color: var(--ink-soft);
  font-size: 1.05rem;
  line-height: 1;
  transition: transform 0.15s ease;
  flex-shrink: 0;
}
.row-chevron.open {
  transform: rotate(90deg);
}
.row-name {
  color: var(--ink);
  font-size: 0.95rem;
}
.family .row-name {
  font-weight: 600;
}
.branch .row-name {
  color: var(--ink-soft);
  font-size: 0.88rem;
}
.row-tier {
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
  flex-shrink: 0;
}
.tier-core {
  background: var(--accent-soft);
  color: var(--accent);
}
.tier-major {
  border: 1px solid var(--line);
  color: var(--ink-soft);
}
.tier-specialized,
.tier-historical {
  color: var(--ink-soft);
  opacity: 0.75;
}
.row-eco {
  font-size: 0.72rem;
  color: var(--ink-soft);
  font-variant-numeric: tabular-nums;
}
.row-side {
  font-size: 0.8rem;
}
.row-count {
  margin-left: auto;
  font-size: 0.74rem;
  color: var(--ink-soft);
  white-space: nowrap;
}
.row-lesson-chip {
  margin-left: auto;
  flex-shrink: 0;
  background: none;
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 0.22rem 0.7rem;
  font-size: 0.76rem;
  color: var(--accent);
  cursor: pointer;
}
.row-count + .row-lesson-chip {
  margin-left: 0.6rem;
}
.row-lesson-chip:hover {
  border-color: var(--accent);
  background: var(--accent-soft);
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

@media (max-width: 640px) {
  /* Bigger touch targets; hide ECO to keep rows to one line. */
  .row-line {
    padding: 0.55rem 0.4rem;
  }
  .row-line.family {
    padding: 0.7rem 0.4rem;
  }
  .row-eco {
    display: none;
  }
  .row-tier {
    font-size: 0.58rem;
  }
}
</style>
