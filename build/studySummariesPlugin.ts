import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { Plugin } from 'vite'

/**
 * Serves `virtual:study-summaries`: the library-card projection of every
 * bundled StudySeed, extracted at build time so the full study JSONs can
 * stay out of the main bundle (they load on demand as their own chunks —
 * see lazyBundledRepository). The extraction MUST stay field-for-field in
 * sync with domain/study/summary.ts toSummary(); the content test suite
 * asserts that equivalence.
 */
const VIRTUAL_ID = 'virtual:study-summaries'
const RESOLVED_ID = '\0' + VIRTUAL_ID

export function studySummariesPlugin(contentDir = 'src/content'): Plugin {
  return {
    name: 'knightnotes:study-summaries',
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : undefined
    },
    load(id) {
      if (id !== RESOLVED_ID) return
      const root = resolve(contentDir)
      const files = readdirSync(root, { recursive: true, encoding: 'utf8' })
        .filter((f) => f.endsWith('.json'))
        .sort()
      const summaries = []
      for (const file of files) {
        const path = join(root, file)
        this.addWatchFile(path)
        let seed: Record<string, unknown>
        try {
          seed = JSON.parse(readFileSync(path, 'utf8'))
        } catch {
          continue // unparseable content is caught loudly by the test gate
        }
        const summary: Record<string, unknown> = {
          id: seed.id,
          slug: seed.slug ?? seed.id,
          title: seed.title,
          type: seed.type,
          tags: seed.tags ?? [],
          concepts: seed.concepts ?? [],
        }
        if (seed.catalogCode) summary.catalogCode = seed.catalogCode
        if (seed.focus) summary.focus = seed.focus
        if (seed.subtitle) summary.subtitle = seed.subtitle
        if (seed.difficulty) summary.difficulty = seed.difficulty
        if (seed.summary) summary.summary = seed.summary
        if (seed.metadata) summary.metadata = seed.metadata
        summaries.push(summary)
      }
      return `export default ${JSON.stringify(summaries)}`
    },
  }
}
