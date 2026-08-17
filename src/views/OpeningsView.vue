<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useOpeningsStore } from '../application/openings/openingsStore'
import type { OpeningNode } from '../domain/openings/types'
import { TIER_LABELS } from '../application/openings/catalog'
import OpeningRow from '../components/openings/OpeningRow.vue'

const openings = useOpeningsStore()
const router = useRouter()

onMounted(() => openings.load())

const searching = computed(() => openings.query.trim().length > 0)

function lessonFor(node: OpeningNode): string | undefined {
  if (node.lessonStatus === 'available') return node.lessonId
  if (node.branchOfLessonId) {
    const owner = [...openings.nodes.values()].find(
      (n) => n.lessonId === node.branchOfLessonId && n.lessonStatus === 'available',
    )
    return owner?.lessonId
  }
  return undefined
}

function openHit(node: OpeningNode) {
  const lesson = lessonFor(node)
  if (lesson) router.push(`/study/${lesson}`)
}
</script>

<template>
  <section class="openings">
    <div class="openings-head">
      <div>
        <h2>Openings</h2>
        <p class="openings-sub">
          The map of opening theory — every family, and how its variations relate.
        </p>
      </div>
      <div class="controls">
        <input
          v-model="openings.query"
          type="search"
          class="search"
          placeholder="Search openings — try “Larsen” or “Najdorf”"
          data-test="openings-search"
        />
        <div class="side-filter" role="tablist" aria-label="Side">
          <button
            v-for="opt in [
              { id: 'all', label: 'All' },
              { id: 'white', label: 'For White' },
              { id: 'black', label: 'For Black' },
            ]"
            :key="opt.id"
            class="filter"
            :class="{ active: openings.side === opt.id }"
            :data-test="`side-${opt.id}`"
            @click="openings.side = opt.id as 'all' | 'white' | 'black'"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>
    </div>

    <p v-if="openings.error" class="openings-error">{{ openings.error }}</p>

    <!-- Search results: flat, honest about status -->
    <ul v-if="searching" class="search-results" data-test="search-results">
      <li v-if="openings.searchResults.length === 0" class="openings-empty">
        No opening matches “{{ openings.query }}”.
      </li>
      <li
        v-for="hit in openings.searchResults"
        :key="hit.node.id"
        class="search-hit"
        :class="{ clickable: !!lessonFor(hit.node) }"
        :data-test="`hit-${hit.node.id}`"
        @click="openHit(hit.node)"
      >
        <div class="hit-main">
          <span class="hit-name">{{ hit.node.fullName ?? hit.node.canonicalName }}</span>
          <span v-if="hit.matchedAlias" class="hit-alias">also “{{ hit.matchedAlias }}”</span>
          <span v-if="hit.node.eco?.length" class="row-eco">{{ hit.node.eco.join(', ') }}</span>
        </div>
        <div class="hit-meta">
          <span v-if="hit.familyName && hit.familyName !== hit.node.canonicalName">
            {{ hit.familyName }} ·
          </span>
          <span>{{ TIER_LABELS[hit.node.tier] }}</span>
          <span v-if="lessonFor(hit.node)" class="hit-open">Open lesson →</span>
          <span v-else-if="hit.node.tier === 'excluded' && hit.node.notes" class="hit-note">
            — {{ hit.node.notes }}
          </span>
        </div>
      </li>
    </ul>

    <!-- Browse tree -->
    <template v-else>
      <section
        v-for="group in openings.grouped"
        :key="group.id"
        class="group"
        :data-test="`group-${group.id}`"
      >
        <h3 class="group-title">{{ group.label }}</h3>
        <ul class="family-list">
          <OpeningRow
            v-for="family in group.families"
            :key="family.id"
            :node="family"
            :depth="0"
          />
        </ul>
      </section>
    </template>
  </section>
</template>

<style scoped>
.openings-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.4rem;
}
.openings-head h2 {
  font-size: 1.5rem;
}
.openings-sub {
  margin: 0.15rem 0 0;
  color: var(--ink-soft);
  font-size: 0.9rem;
}
.controls {
  display: flex;
  gap: 0.6rem;
  align-items: center;
  flex-wrap: wrap;
}
/* Phones: search and filters stay pinned while the trees scroll. */
@media (max-width: 640px) {
  .openings-head {
    margin-bottom: 0.9rem;
  }
  .controls {
    position: sticky;
    top: 0;
    z-index: 10;
    width: 100%;
    background: var(--paper);
    padding: 0.5rem 0;
    gap: 0.5rem;
  }
  .search {
    flex: 1 1 100%;
    min-width: 0;
  }
}
.search {
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 0.4rem 1rem;
  font-size: 0.9rem;
  min-width: 260px;
  background: var(--surface);
  color: var(--ink);
}
.search:focus {
  outline: none;
  border-color: var(--accent);
}
.side-filter {
  display: flex;
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
.group {
  margin-bottom: 1.5rem;
}
.group-title {
  font-size: 1.05rem;
  margin-bottom: 0.4rem;
  padding-bottom: 0.3rem;
  border-bottom: 1px solid var(--line);
}
.family-list {
  margin: 0;
  padding: 0;
}
.search-results {
  margin: 0;
  padding: 0;
}
.search-hit {
  list-style: none;
  padding: 0.55rem 0.6rem;
  border-bottom: 1px solid var(--line);
  border-radius: 6px;
}
.search-hit.clickable {
  cursor: pointer;
}
.search-hit.clickable:hover {
  background: var(--accent-soft);
}
.hit-main {
  display: flex;
  align-items: baseline;
  gap: 0.55rem;
  flex-wrap: wrap;
}
.hit-name {
  font-size: 0.98rem;
}
.hit-alias {
  font-size: 0.8rem;
  color: var(--ink-soft);
  font-style: italic;
}
.row-eco {
  font-size: 0.72rem;
  color: var(--ink-soft);
}
.hit-meta {
  font-size: 0.78rem;
  color: var(--ink-soft);
  margin-top: 0.12rem;
}
.hit-open {
  color: var(--accent);
  margin-left: 0.4rem;
}
.hit-note {
  font-style: italic;
}
.openings-error,
.openings-empty {
  color: var(--ink-soft);
  list-style: none;
}
</style>
