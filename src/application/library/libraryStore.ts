import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { StudySummary } from '../../domain/study/types'
import { getRepository } from '../repositoryProvider'
import { CATEGORIES, categoryOf } from './categories'

/** The study featured as the "Start here" introduction in the library. */
export const FEATURED_STUDY_ID = 'opera-game'

/** Category order (matching the filter bar), then catalog code, then title. */
function summaryOrder(a: StudySummary, b: StudySummary): number {
  const categoryIndex = (s: StudySummary) =>
    CATEGORIES.findIndex((c) => c.id === categoryOf(s.type))
  if (categoryIndex(a) !== categoryIndex(b)) return categoryIndex(a) - categoryIndex(b)
  if (a.catalogCode && b.catalogCode) return a.catalogCode.localeCompare(b.catalogCode)
  if (a.catalogCode !== b.catalogCode) return a.catalogCode ? -1 : 1
  return a.title.localeCompare(b.title)
}

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

  const featured = computed(
    () => summaries.value.find((s) => s.id === FEATURED_STUDY_ID) ?? null,
  )

  async function load() {
    loading.value = true
    error.value = null
    try {
      summaries.value = (await getRepository().list()).sort(summaryOrder)
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

  return { summaries, category, loading, error, filtered, featured, load, setCategory }
})
