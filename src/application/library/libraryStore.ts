import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { StudySummary } from '../../domain/study/types'
import { getRepository } from '../repositoryProvider'
import { categoryOf } from './categories'

export const useLibraryStore = defineStore('library', () => {
  const summaries = ref<StudySummary[]>([])
  const category = ref<string>('all')
  const loading = ref(false)
  const error = ref<string | null>(null)

  const filtered = computed(() =>
    category.value === 'all'
      ? summaries.value
      : summaries.value.filter((s) => categoryOf(s.type) === category.value),
  )

  async function load() {
    loading.value = true
    error.value = null
    try {
      summaries.value = await getRepository().list()
    } catch (e) {
      error.value = 'Could not load the study library.'
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  function setCategory(id: string) {
    category.value = id
  }

  return { summaries, category, loading, error, filtered, load, setCategory }
})
