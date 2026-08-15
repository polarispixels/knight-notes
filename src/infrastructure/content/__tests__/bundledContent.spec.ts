import { describe, it, expect } from 'vitest'
import { loadBundledStudies } from '../bundledStudyRepository'
import { getNode, mainlineIds, pathToNode } from '../../../domain/study/traversal'

/**
 * Quality gate for everything in src/content: every seed must convert
 * (which proves every move is legal and every FEN is engine-generated),
 * be structurally sound, and actually teach.
 */
describe('bundled content', () => {
  const studies = loadBundledStudies()

  it('ships a catalog of studies', () => {
    expect(studies.length).toBeGreaterThanOrEqual(10)
  })

  it('has unique ids', () => {
    const ids = studies.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it.each(studies.map((s) => [s.id, s] as const))(
    '%s is structurally sound and annotated',
    (_id, study) => {
      // referential integrity
      for (const node of Object.values(study.nodes)) {
        for (const childId of node.children) {
          expect(getNode(study, childId).parentId).toBe(node.id)
        }
        if (node.preferredChildId) {
          expect(node.children).toContain(node.preferredChildId)
        }
        // every node reachable from the root
        expect(pathToNode(study, node.id)[0]).toBe(study.rootNodeId)
      }

      // a real line to study
      expect(mainlineIds(study).length).toBeGreaterThan(4)

      // teaches: has a summary and meaningful annotations
      expect(study.summary, `${study.id} needs a summary`).toBeTruthy()
      const annotations = Object.values(study.nodes).flatMap((n) => n.annotations ?? [])
      expect(annotations.length, `${study.id} needs annotations`).toBeGreaterThanOrEqual(4)
      for (const a of annotations) {
        expect(a.body.trim().length, `${study.id}: empty annotation`).toBeGreaterThan(10)
      }
      expect(study.concepts.length, `${study.id} needs concepts`).toBeGreaterThan(0)
    },
  )
})
