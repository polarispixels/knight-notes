import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import type { Study } from '../../domain/study/types'
import { toSummary } from '../../domain/study/summary'
import type { StudyRepository } from '../repository'
import { createBundledRepository, convertSeeds } from '../content/bundledStudyRepository'
import { createLocalRepository } from '../storage/localStudyRepository'
import { CompositeStudyRepository } from '../content/compositeStudyRepository'
import { getPref, setPref } from '../storage/preferences'

function makeStudy(id: string, title = `Study ${id}`): Study {
  return {
    id,
    slug: id,
    title,
    type: 'game',
    tags: ['t'],
    concepts: ['c'],
    rootNodeId: 'root',
    nodes: { root: { id: 'root', fen: 'fen', ply: 0, children: [] } },
  }
}

describe('toSummary', () => {
  it('projects a study onto its summary with a source tag', () => {
    const summary = toSummary(makeStudy('a'), 'bundled')
    expect(summary).toMatchObject({
      id: 'a',
      title: 'Study a',
      type: 'game',
      tags: ['t'],
      concepts: ['c'],
      source: 'bundled',
    })
    expect('nodes' in summary).toBe(false)
  })
})

describe('bundled repository', () => {
  it('lists and gets bundled studies, refuses writes', async () => {
    const repo = createBundledRepository([makeStudy('opera')])
    const list = await repo.list()
    expect(list).toHaveLength(1)
    expect(list[0].source).toBe('bundled')
    expect((await repo.get('opera'))?.title).toBe('Study opera')
    expect(await repo.get('missing')).toBeNull()
    await expect(repo.save(makeStudy('x'))).rejects.toThrow()
    await expect(repo.delete('opera')).rejects.toThrow()
  })
})

describe('local repository (IndexedDB)', () => {
  let repo: StudyRepository
  beforeEach(() => {
    repo = createLocalRepository(`test-db-${Math.random().toString(36).slice(2)}`)
  })

  it('saves, lists, gets, and deletes studies preserving IDs', async () => {
    const study = makeStudy('imported-1')
    await repo.save(study)
    const list = await repo.list()
    expect(list.map((s) => s.id)).toEqual(['imported-1'])
    expect(list[0].source).toBe('local')
    const roundTripped = await repo.get('imported-1')
    expect(roundTripped).toEqual({ ...study, source: 'local' })
    await repo.delete('imported-1')
    expect(await repo.get('imported-1')).toBeNull()
    expect(await repo.list()).toEqual([])
  })
})

describe('CompositeStudyRepository', () => {
  it('merges lists, reads local first, writes only to local', async () => {
    const bundled = createBundledRepository([makeStudy('opera', 'Opera Game')])
    const local = createLocalRepository(`test-db-${Math.random().toString(36).slice(2)}`)
    const repo = new CompositeStudyRepository(bundled, local)

    await repo.save(makeStudy('mine'))
    const list = await repo.list()
    expect(list.map((s) => s.id).sort()).toEqual(['mine', 'opera'])

    expect((await repo.get('opera'))?.title).toBe('Opera Game')
    expect((await repo.get('mine'))?.title).toBe('Study mine')
    expect(await repo.get('nope')).toBeNull()

    await repo.delete('mine')
    expect(await repo.get('mine')).toBeNull()
    await expect(repo.delete('opera')).rejects.toThrow(/bundled/i)
  })
})

describe('preferences', () => {
  it('round-trips JSON values through localStorage', () => {
    setPref('orientation', 'black')
    expect(getPref('orientation', 'white')).toBe('black')
    expect(getPref('missing-key', 42)).toBe(42)
  })
})

describe('CompositeStudyRepository: storage resilience', () => {
  const failing: StudyRepository = {
    list: async () => {
      throw new Error('idb unavailable')
    },
    get: async () => {
      throw new Error('idb unavailable')
    },
    save: async () => {
      throw new Error('idb unavailable')
    },
    delete: async () => {
      throw new Error('idb unavailable')
    },
  }

  it('still serves bundled studies when local storage fails', async () => {
    const repo = new CompositeStudyRepository(createBundledRepository([makeStudy('opera')]), failing)
    expect((await repo.get('opera'))?.id).toBe('opera')
    expect((await repo.list()).map((s) => s.id)).toEqual(['opera'])
  })
})

describe('bundled seed isolation', () => {
  it('skips a broken seed without dropping the healthy ones', () => {
    const good = { id: 'good', title: 'Good', type: 'game', summary: 's', line: [{ san: 'e4' }] }
    const bad = { id: 'bad', title: 'Bad', type: 'game', line: [{ san: 'Ke5' }] }
    const studies = convertSeeds([good, bad] as never)
    expect(studies.map((s) => s.id)).toEqual(['good'])
  })
})
