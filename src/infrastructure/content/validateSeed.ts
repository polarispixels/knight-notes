/**
 * Schema validation for the StudySeed authoring format.
 * Returns human-readable errors with the location of each problem, so a
 * content author can fix a file without reading application source.
 * Chess legality is checked separately, by replaying moves in seedToStudy.
 */
import type {
  AnnotationType,
  Difficulty,
  ImportanceLevel,
  MoveClassification,
  StudyType,
} from '../../domain/study/types'

const STUDY_TYPES: StudyType[] = [
  'game', 'opening', 'variation', 'gambit', 'trap', 'tactic', 'endgame', 'pattern',
]
const DIFFICULTIES: Difficulty[] = ['beginner', 'intermediate', 'advanced']
const CLASSIFICATIONS: MoveClassification[] = [
  'normal', 'interesting', 'critical', 'theory', 'forced', 'mistake', 'blunder', 'sacrifice', 'novelty',
]
const IMPORTANCE: ImportanceLevel[] = ['normal', 'notable', 'important', 'critical']
const ANNOTATION_TYPES: AnnotationType[] = [
  'commentary', 'question', 'key-idea', 'critical-position', 'principle',
  'warning', 'historical', 'mistake', 'strategy', 'tactic',
]

const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/
const SQUARE_RE = /^[a-h][1-8]$/
const CATALOG_CODE_RE = /^[A-Z]{1,3}\d{3}$/
const FEN_RE =
  /^([1-8KQRBNPkqrbnp]+\/){7}[1-8KQRBNPkqrbnp]+ [wb] (-|K?Q?k?q?) (-|[a-h][36])( \d+ \d+)?$/

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any

export function validateSeed(seed: unknown): string[] {
  const errors: string[] = []
  const err = (at: string, message: string) => errors.push(`${at}: ${message}`)

  if (typeof seed !== 'object' || seed === null || Array.isArray(seed)) {
    return ['seed: must be a JSON object']
  }
  const s = seed as Any

  if (typeof s.id !== 'string' || !ID_RE.test(s.id)) {
    err('id', 'required; must be kebab-case (lowercase letters, digits, hyphens), e.g. "opera-game"')
  }
  if (typeof s.title !== 'string' || s.title.trim() === '') {
    err('title', 'required; must be a non-empty string')
  }
  if (!STUDY_TYPES.includes(s.type)) {
    err('type', `required; must be one of ${STUDY_TYPES.join(', ')} (got ${JSON.stringify(s.type)})`)
  }
  if (s.difficulty !== undefined && !DIFFICULTIES.includes(s.difficulty)) {
    err('difficulty', `must be one of ${DIFFICULTIES.join(', ')} (got ${JSON.stringify(s.difficulty)})`)
  }
  if (s.catalogCode !== undefined && (typeof s.catalogCode !== 'string' || !CATALOG_CODE_RE.test(s.catalogCode))) {
    err('catalogCode', 'must look like "G001", "TR002", "GB001"')
  }
  if (s.initialFen !== undefined && (typeof s.initialFen !== 'string' || !FEN_RE.test(s.initialFen))) {
    err('initialFen', 'must be a valid FEN string, e.g. "1K1k4/1P6/8/8/8/8/r7/2R5 w - - 0 1"')
  }
  for (const field of ['summary', 'subtitle', 'description', 'slug'] as const) {
    if (s[field] !== undefined && typeof s[field] !== 'string') err(field, 'must be a string')
  }
  for (const field of ['tags', 'concepts'] as const) {
    if (s[field] !== undefined && !(Array.isArray(s[field]) && s[field].every((t: Any) => typeof t === 'string'))) {
      err(field, 'must be an array of strings')
    }
  }

  validateAnnotations(s.rootAnnotations, 'rootAnnotations', err)
  validateVisual(s.rootVisual, 'rootVisual', err)

  if (!Array.isArray(s.line) || s.line.length === 0) {
    err('line', 'required; must be a non-empty array of moves (SAN strings or move objects)')
  } else {
    validateLine(s.line, 'line', err)
  }

  return errors
}

function validateLine(line: Any[], at: string, err: (at: string, m: string) => void): void {
  line.forEach((move, i) => {
    const here = `${at}[${i}]`
    if (typeof move === 'string') {
      if (move.trim() === '') err(here, 'SAN string must not be empty')
      return
    }
    if (typeof move !== 'object' || move === null) {
      err(here, `each move must be a SAN string or a move object (got ${JSON.stringify(move)})`)
      return
    }
    if (typeof move.san !== 'string' || move.san.trim() === '') {
      err(`${here}.san`, 'required; must be a SAN string like "Nf3" or "O-O"')
    }
    if (move.classification !== undefined && !CLASSIFICATIONS.includes(move.classification)) {
      err(`${here}.classification`, `must be one of ${CLASSIFICATIONS.join(', ')} (got ${JSON.stringify(move.classification)})`)
    }
    if (move.importance !== undefined && !IMPORTANCE.includes(move.importance)) {
      err(`${here}.importance`, `must be one of ${IMPORTANCE.join(', ')} (got ${JSON.stringify(move.importance)})`)
    }
    validateAnnotations(move.annotations, `${here}.annotations`, err)
    validateVisual(move.visual, `${here}.visual`, err)
    if (move.variations !== undefined) {
      if (!Array.isArray(move.variations) || move.variations.some((v: Any) => !Array.isArray(v))) {
        err(`${here}.variations`, 'must be an array of lines (each line an array of moves)')
      } else {
        move.variations.forEach((variation: Any[], vi: number) =>
          validateLine(variation, `${here}.variations[${vi}]`, err),
        )
      }
    }
  })
}

function validateAnnotations(annotations: Any, at: string, err: (at: string, m: string) => void): void {
  if (annotations === undefined) return
  if (!Array.isArray(annotations)) {
    err(at, 'must be an array of annotation objects')
    return
  }
  annotations.forEach((a, i) => {
    const here = `${at}[${i}]`
    if (typeof a !== 'object' || a === null) {
      err(here, 'must be an annotation object')
      return
    }
    if (!ANNOTATION_TYPES.includes(a.type)) {
      err(`${here}.type`, `must be one of ${ANNOTATION_TYPES.join(', ')} (got ${JSON.stringify(a.type)})`)
    }
    if (typeof a.body !== 'string' || a.body.trim() === '') {
      err(`${here}.body`, 'required; must be a non-empty string')
    }
    if (a.title !== undefined && typeof a.title !== 'string') err(`${here}.title`, 'must be a string')
    if (a.concepts !== undefined && !(Array.isArray(a.concepts) && a.concepts.every((c: Any) => typeof c === 'string'))) {
      err(`${here}.concepts`, 'must be an array of strings')
    }
  })
}

function validateVisual(visual: Any, at: string, err: (at: string, m: string) => void): void {
  if (visual === undefined) return
  if (!Array.isArray(visual)) {
    err(at, 'must be an array of visual annotations')
    return
  }
  visual.forEach((v, i) => {
    const here = `${at}[${i}]`
    if (typeof v !== 'object' || v === null) {
      err(here, 'must be a visual annotation object')
      return
    }
    if (v.type === 'square') {
      if (typeof v.square !== 'string' || !SQUARE_RE.test(v.square)) {
        err(`${here}.square`, `must be a square like "f7" (got ${JSON.stringify(v.square)})`)
      }
    } else if (v.type === 'arrow') {
      for (const end of ['from', 'to'] as const) {
        if (typeof v[end] !== 'string' || !SQUARE_RE.test(v[end])) {
          err(`${here}.${end}`, `must be a square like "f7" (got ${JSON.stringify(v[end])})`)
        }
      }
    } else {
      err(`${here}.type`, `must be "square" or "arrow" (got ${JSON.stringify(v.type)})`)
    }
  })
}
