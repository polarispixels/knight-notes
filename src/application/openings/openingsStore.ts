import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { OpeningGroup, OpeningNode, OpeningSide } from '../../domain/openings/types'
import { getRepository } from '../repositoryProvider'
import { buildCatalog, matchesQuery, searchHaystack } from './catalog'
import catalogData from '../../data/openings-catalog.json'

/** Display order of the top-level navigation groups. */
export const GROUP_ORDER: { id: OpeningGroup; label: string }[] = [
  { id: 'kings-pawn', label: "King's Pawn — 1.e4 e5" },
  { id: 'sicilian', label: 'Sicilian Defense' },
  { id: 'semi-open', label: 'Semi-Open Defenses' },
  { id: 'queens-gambit', label: "Queen's Gambit & Catalan" },
  { id: 'indian', label: 'Indian Defenses' },
  { id: 'queens-pawn', label: "Queen's Pawn Systems & Dutch" },
  { id: 'flank', label: 'Flank & Irregular' },
]

export type SideFilter = 'all' | OpeningSide

export interface SearchHit {
  node: OpeningNode
  familyName: string
  /** The alias that matched, when the canonical name itself didn't. */
  matchedAlias?: string
}

export const useOpeningsStore = defineStore('openings', () => {
  const nodes = ref<Map<string, OpeningNode>>(new Map())
  const query = ref('')
  const side = ref<SideFilter>('all')
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load() {
    if (nodes.value.size > 0 || loading.value) return
    loading.value = true
    try {
      const summaries = await getRepository().list()
      const available = new Set(summaries.map((s) => s.id))
      nodes.value = buildCatalog(catalogData.entries as OpeningNode[], available)
      error.value = null
    } catch (e) {
      console.error(e)
      error.value = 'Could not load the opening catalog.'
    } finally {
      loading.value = false
    }
  }

  const all = computed(() => [...nodes.value.values()])

  const families = computed(() =>
    all.value
      .filter((n) => n.level === 'family')
      .sort((a, b) => a.canonicalName.localeCompare(b.canonicalName)),
  )

  function sideMatches(node: OpeningNode): boolean {
    return side.value === 'all' || node.side === side.value || node.side === 'both'
  }

  /** An entry is visible in the tree when it (or any descendant) passes the
   *  side filter; excluded entries never appear in the tree. */
  const visibleIds = computed(() => {
    const visible = new Set<string>()
    const mark = (node: OpeningNode): boolean => {
      if (node.tier === 'excluded') return false
      let any = sideMatches(node)
      for (const childId of node.children) {
        const child = nodes.value.get(childId)
        if (child && mark(child)) any = true
      }
      if (any) visible.add(node.id)
      return any
    }
    for (const f of families.value) mark(f)
    return visible
  })

  /** Families per navigation group, in display order. */
  const grouped = computed(() =>
    GROUP_ORDER.map((group) => ({
      ...group,
      families: families.value.filter(
        (f) => f.group === group.id && visibleIds.value.has(f.id),
      ),
    })).filter((g) => g.families.length > 0),
  )

  /** Flat name/alias search across every entry, excluded included —
   *  search must answer honestly even for what the curriculum omits. */
  const searchResults = computed<SearchHit[]>(() => {
    const q = query.value.trim()
    if (!q) return []
    const hits: SearchHit[] = []
    for (const node of all.value) {
      const haystack = searchHaystack(node)
      if (!matchesQuery(haystack, q) || !sideMatches(node)) continue
      const names = [node.canonicalName, node.fullName, node.shortName].filter(
        Boolean,
      ) as string[]
      const inNames = names.some((n) => matchesQuery(n.toLowerCase(), q))
      hits.push({
        node,
        familyName: nodes.value.get(node.familyId)?.canonicalName ?? '',
        matchedAlias: inNames
          ? undefined
          : node.aliases?.find((a) => matchesQuery(a.toLowerCase(), q)),
      })
    }
    const tierRank = { core: 0, major: 1, specialized: 2, historical: 3, 'branch-only': 4, excluded: 5 }
    return hits.sort(
      (a, b) =>
        tierRank[a.node.tier] - tierRank[b.node.tier] ||
        a.node.canonicalName.localeCompare(b.node.canonicalName),
    )
  })

  function nodeById(id: string): OpeningNode | undefined {
    return nodes.value.get(id)
  }

  return {
    nodes,
    query,
    side,
    loading,
    error,
    load,
    grouped,
    visibleIds,
    searchResults,
    nodeById,
  }
})
