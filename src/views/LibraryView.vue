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
