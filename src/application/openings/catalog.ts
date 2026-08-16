import type {
  OpeningCatalogEntry,
  OpeningNode,
  OpeningTier,
} from '../../domain/openings/types'
import { STANDALONE_TIERS } from '../../domain/openings/types'

/**
 * Builds the derived view of the opening catalog: children and
 * transposesFrom edges (inverses of the stored parent/transposesTo edges),
 * standalone flags, and lesson availability against the shipped studies.
 */
export function buildCatalog(
  entries: OpeningCatalogEntry[],
  availableLessonIds: Set<string>,
): Map<string, OpeningNode> {
  const nodes = new Map<string, OpeningNode>()
  for (const entry of entries) {
    const standalone = STANDALONE_TIERS.includes(entry.tier)
    nodes.set(entry.id, {
      ...entry,
      children: [],
      transposesFrom: [],
      standalone,
      lessonStatus:
        entry.lessonId && availableLessonIds.has(entry.lessonId)
          ? 'available'
          : standalone
            ? 'planned'
            : 'none',
    })
  }
  for (const node of nodes.values()) {
    if (node.parentId) nodes.get(node.parentId)?.children.push(node.id)
    for (const target of node.transposesTo ?? [])
      nodes.get(target)?.transposesFrom.push(node.id)
  }
  return nodes
}

/** Search text for an entry: canonical + full + short names and aliases. */
export function searchHaystack(entry: OpeningCatalogEntry): string {
  return [entry.canonicalName, entry.fullName, entry.shortName, ...(entry.aliases ?? [])]
    .filter(Boolean)
    .join('\n')
    .toLowerCase()
}

/**
 * Matches a query against names and aliases. Every whitespace-separated
 * term must appear somewhere, so "larsen attack" finds the Nimzo-Larsen
 * Attack via its alias while "berlin" finds the Berlin Defense.
 */
export function matchesQuery(haystack: string, query: string): boolean {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  return terms.length > 0 && terms.every((t) => haystack.includes(t))
}

export const TIER_LABELS: Record<OpeningTier, string> = {
  core: 'Core',
  major: 'Major',
  specialized: 'Specialized',
  historical: 'Historical',
  'branch-only': 'Covered in a parent lesson',
  excluded: 'Not in the curriculum',
}
