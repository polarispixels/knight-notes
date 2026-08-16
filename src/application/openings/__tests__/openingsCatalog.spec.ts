import { describe, it, expect } from 'vitest'
import catalogData from '../../../data/openings-catalog.json'
import type { OpeningCatalogEntry } from '../../../domain/openings/types'
import { STANDALONE_TIERS } from '../../../domain/openings/types'
import { buildCatalog } from '../catalog'
import { createEngine } from '../../../infrastructure/chess/engine'
import { loadBundledStudies } from '../../../infrastructure/content/bundledStudyRepository'

/**
 * Quality gate for the opening catalog: identity, taxonomy, hierarchy,
 * chess legality of every canonical move order, and lesson wiring. The
 * catalog is data the openings browser trusts blindly, so everything it
 * assumes is asserted here.
 */
const entries = catalogData.entries as OpeningCatalogEntry[]
const byId = new Map(entries.map((e) => [e.id, e]))

const LEVELS = ['family', 'opening', 'variation', 'subvariation']
const TYPES = ['defense', 'system', 'gambit', 'countergambit', 'attack', 'classical', 'irregular']
const SIDES = ['white', 'black', 'both']
const TIERS = [...STANDALONE_TIERS, 'branch-only', 'excluded']
const GROUPS = ['kings-pawn', 'sicilian', 'semi-open', 'queens-gambit', 'indian', 'queens-pawn', 'flank']
const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/
const ECO_RE = /^[A-E]\d{2}(-[A-E]\d{2})?$/

describe('openings catalog', () => {
  it('is a substantial catalog', () => {
    expect(entries.length).toBeGreaterThanOrEqual(200)
    const standalone = entries.filter((e) => STANDALONE_TIERS.includes(e.tier))
    expect(standalone.length).toBeGreaterThanOrEqual(150)
  })

  it('has unique ids and no name/canonical collisions inside a family', () => {
    expect(new Set(entries.map((e) => e.id)).size).toBe(entries.length)
    const seen = new Map<string, string>()
    for (const e of entries) {
      const key = `${e.familyId}::${(e.fullName ?? e.canonicalName).toLowerCase()}`
      expect(seen.has(key), `duplicate name "${key}" (${e.id} vs ${seen.get(key)})`).toBe(false)
      seen.set(key, e.id)
    }
  })

  it.each(entries.map((e) => [e.id, e] as const))('%s is well-formed', (_, e) => {
    expect(e.id).toMatch(ID_RE)
    expect(e.canonicalName.trim().length).toBeGreaterThan(0)
    expect(LEVELS).toContain(e.level)
    expect(TYPES).toContain(e.openingType)
    expect(SIDES).toContain(e.side)
    expect(TIERS).toContain(e.tier)
    for (const eco of e.eco ?? []) expect(eco).toMatch(ECO_RE)

    // Hierarchy shape
    if (e.level === 'family') {
      expect(e.parentId).toBeNull()
      expect(e.familyId).toBe(e.id)
      expect(GROUPS).toContain(e.group)
    } else {
      expect(e.parentId && byId.has(e.parentId), `parent "${e.parentId}"`).toBe(true)
      expect(byId.get(e.familyId)?.level).toBe('family')
      expect(e.group).toBeUndefined()
    }

    // No cycles: walking parents terminates at a family root.
    const seen = new Set<string>()
    let cur: OpeningCatalogEntry | undefined = e
    while (cur?.parentId) {
      expect(seen.has(cur.id), `cycle at ${cur.id}`).toBe(false)
      seen.add(cur.id)
      cur = byId.get(cur.parentId)
    }
    expect(cur?.familyId).toBe(e.familyId)

    // Cross-references resolve.
    for (const r of [...(e.related ?? []), ...(e.transposesTo ?? [])])
      expect(byId.has(r), `unresolved reference "${r}"`).toBe(true)

    // Chess: the canonical move order is legal from the start position.
    const engine = createEngine()
    for (const san of e.moves.replace(/\d+\.(\.\.)?/g, ' ').split(/\s+/).filter(Boolean))
      expect(engine.move(san), `illegal move ${san} in ${e.moves}`).not.toBeNull()

    // Lesson wiring by tier.
    if (STANDALONE_TIERS.includes(e.tier)) {
      expect(e.lessonId, 'standalone entries plan a lesson').toBeTruthy()
      expect(e.branchOfLessonId).toBeUndefined()
    } else {
      expect(e.lessonId).toBeUndefined()
      if (e.tier === 'branch-only') {
        const owner = entries.find((o) => o.lessonId === e.branchOfLessonId)
        expect(owner, `branchOfLessonId "${e.branchOfLessonId}" owned by no entry`).toBeTruthy()
      }
      if (e.tier === 'excluded') expect(e.notes, 'excluded entries explain themselves').toBeTruthy()
    }
  })

  it('links every existing opening/gambit study from the catalog', () => {
    const studies = loadBundledStudies()
    const linked = new Set(entries.map((e) => e.lessonId).filter(Boolean))
    for (const s of studies.filter((x) => ['opening', 'variation', 'gambit'].includes(x.type)))
      expect(linked.has(s.id), `study "${s.id}" not linked from catalog`).toBe(true)
  })

  it('derives a consistent graph (buildCatalog)', () => {
    const nodes = buildCatalog(entries, new Set(['ruy-lopez']))
    const ruy = nodes.get('ruy-lopez')!
    expect(ruy.lessonStatus).toBe('available')
    expect(ruy.children.length).toBeGreaterThan(5)
    expect(nodes.get('sicilian-najdorf')!.lessonStatus).toBe('planned')
    // transposesFrom is the exact inverse of transposesTo.
    for (const n of nodes.values())
      for (const t of n.transposesTo ?? [])
        expect(nodes.get(t)!.transposesFrom).toContain(n.id)
  })
})
