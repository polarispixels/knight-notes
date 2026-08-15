import { describe, it, expect } from 'vitest'
import { seedToStudy, type StudySeed } from '../seed'
import { getNode, mainlineIds, variationsAt } from '../../../domain/study/traversal'

const SEED: StudySeed = {
  id: 'legal-trap',
  title: 'Légal Trap',
  type: 'trap',
  difficulty: 'beginner',
  summary: 'A queen sacrifice that punishes a premature pin.',
  tags: ['Italian Game'],
  concepts: ['pins', 'sacrifice'],
  rootAnnotations: [
    { type: 'commentary', body: 'The trap arises from the Italian Game.' },
  ],
  line: [
    { san: 'e4' },
    { san: 'e5' },
    {
      san: 'Nf3',
      annotations: [{ type: 'principle', title: 'Develop with threats', body: 'Attacks e5.' }],
      visual: [{ type: 'square', square: 'e5' }],
    },
    {
      san: 'Nc6',
      variations: [
        [{ san: 'd6', annotations: [{ type: 'commentary', body: 'The Philidor setup.' }] }],
      ],
    },
    { san: 'Bc4', importance: 'notable' },
    { san: 'd6' },
    { san: 'Nc3' },
    { san: 'Bg4', classification: 'mistake' },
  ],
}

describe('seedToStudy', () => {
  it('builds a canonical study with computed FENs and plies', () => {
    const study = seedToStudy(SEED)
    expect(study.id).toBe('legal-trap')
    expect(study.slug).toBe('legal-trap')
    const line = mainlineIds(study)
    expect(line).toHaveLength(9)
    const last = getNode(study, line[8])
    expect(last.ply).toBe(8)
    expect(last.moveFromParent).toMatchObject({ san: 'Bg4', classification: 'mistake' })
    expect(last.fen).toContain(' w ')
  })

  it('attaches root annotations and per-move annotations with generated ids', () => {
    const study = seedToStudy(SEED)
    const root = getNode(study, study.rootNodeId)
    expect(root.annotations?.[0].body).toMatch(/Italian/)
    const nf3 = getNode(study, mainlineIds(study)[3])
    expect(nf3.moveFromParent?.san).toBe('Nf3')
    expect(nf3.annotations?.[0]).toMatchObject({ type: 'principle', title: 'Develop with threats' })
    expect(nf3.annotations?.[0].id).toBeTruthy()
    expect(nf3.visualAnnotations).toEqual([{ type: 'square', square: 'e5' }])
  })

  it('builds variations as sibling branches', () => {
    const study = seedToStudy(SEED)
    const afterNf3 = mainlineIds(study)[3]
    const [d6] = variationsAt(study, afterNf3)
    expect(d6.moveFromParent?.san).toBe('d6')
    expect(d6.annotations?.[0].body).toMatch(/Philidor/)
  })

  it('supports FEN starts', () => {
    const study = seedToStudy({
      id: 'lucena',
      title: 'Lucena Position',
      type: 'endgame',
      initialFen: '1K1k4/1P6/8/8/8/8/r7/2R5 w - - 0 1',
      line: [{ san: 'Rd1+' }, { san: 'Ke7' }],
    })
    expect(study.initialFen).toBeTruthy()
    const [, n1] = mainlineIds(study)
    expect(getNode(study, n1).moveFromParent?.san).toBe('Rd1+')
  })

  it('throws a descriptive error on an illegal move', () => {
    expect(() =>
      seedToStudy({ id: 'bad', title: 'Bad', type: 'game', line: [{ san: 'e5' }] }),
    ).toThrow(/bad.*e5/i)
  })
})
