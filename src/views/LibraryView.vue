<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLibraryStore } from '../application/library/libraryStore'
import StudyCard from '../components/library/StudyCard.vue'
import StudyFilters from '../components/library/StudyFilters.vue'

const library = useLibraryStore()
const router = useRouter()

onMounted(() => library.load())
</script>

<template>
  <section class="library">
    <article
      v-if="library.featured && library.category === 'all'"
      class="featured"
      data-test="featured-card"
    >
      <div class="featured-text">
        <span class="featured-kicker">Start here</span>
        <h2 class="featured-title">{{ library.featured.title }}</h2>
        <p class="featured-blurb">
          {{ library.featured.subtitle ?? 'Learn why development, initiative, and king safety matter.' }}
        </p>
      </div>
      <button
        class="btn primary"
        data-test="featured-start"
        @click="router.push(`/study/${library.featured.id}`)"
      >
        Start study →
      </button>
    </article>

    <div class="library-head">
      <h2>Study Library</h2>
      <StudyFilters :active="library.category" @select="library.setCategory" />
    </div>

    <p v-if="library.error" class="library-error">{{ library.error }}</p>
    <p v-else-if="!library.loading && library.filtered.length === 0" class="library-empty">
      No studies in this category yet.
    </p>

    <div class="grid">
      <StudyCard
        v-for="study in library.filtered"
        :key="study.id"
        :study="study"
        @open="router.push(`/study/${study.id}`)"
      />
    </div>
  </section>
</template>

<style scoped>
.featured {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.2rem;
  background: var(--surface);
  border: 1px solid var(--line);
  border-left: 4px solid var(--accent);
  border-radius: var(--radius);
  padding: 1.1rem 1.4rem;
  margin-bottom: 1.6rem;
}
.featured-kicker {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--accent);
}
.featured-title {
  font-size: 1.35rem;
  margin: 0.1rem 0;
}
.featured-blurb {
  margin: 0;
  font-size: 0.9rem;
  color: var(--ink-soft);
}
.featured .btn {
  flex-shrink: 0;
}
@media (max-width: 640px) {
  .featured {
    flex-direction: column;
    align-items: flex-start;
  }
}

.library-head {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin-bottom: 1.2rem;
}
.library-head h2 {
  font-size: 1.5rem;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 0.9rem;
}
.library-error,
.library-empty {
  color: var(--ink-soft);
}
</style>
