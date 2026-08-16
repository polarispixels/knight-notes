/**
 * The Opening Catalog: KnightNotes' curated editorial map of opening
 * theory. Catalog entries define identity, taxonomy, relationships, and
 * search metadata; instructional content stays in studies, which entries
 * reference via lessonId. Like the rest of the domain layer, this module
 * has zero runtime dependencies.
 *
 * The hierarchy (parentId) is a tree for human navigation; transpositions
 * (transposesTo) carry the graph edges the tree cannot. children and
 * transposesFrom are derived at load time, never stored — the JSON keeps
 * a single source of truth per edge.
 */

/** Structural depth in the taxonomy. */
export type OpeningLevel = 'family' | 'opening' | 'variation' | 'subvariation'

/** Character of the opening — orthogonal to level. */
export type OpeningType =
  | 'defense'
  | 'system'
  | 'gambit'
  | 'countergambit'
  | 'attack'
  | 'classical'
  | 'irregular'

/** Whose repertoire choice the opening is. */
export type OpeningSide = 'white' | 'black' | 'both'

/**
 * Editorial inclusion tier. The first four are standalone-lesson tiers;
 * branch-only names are taught inside a parent lesson; excluded names are
 * kept only so search can answer for them honestly.
 */
export type OpeningTier =
  | 'core'
  | 'major'
  | 'specialized'
  | 'historical'
  | 'branch-only'
  | 'excluded'

export const STANDALONE_TIERS: readonly OpeningTier[] = [
  'core',
  'major',
  'specialized',
  'historical',
]

/** Top-level navigation grouping, carried by family entries. */
export type OpeningGroup =
  | 'kings-pawn'
  | 'sicilian'
  | 'semi-open'
  | 'queens-gambit'
  | 'indian'
  | 'queens-pawn'
  | 'flank'

export interface OpeningCatalogEntry {
  /** Stable kebab-case id; variations are family-prefixed (ruy-lopez-berlin). */
  id: string
  canonicalName: string
  /** Disambiguated display/search string ("Sicilian Defense: Najdorf Variation"). */
  fullName?: string
  shortName?: string
  /** Recognized alternate names; search matches these. */
  aliases?: string[]
  /** Root family entry id; family entries point at themselves. */
  familyId: string
  /** Tree parent; null only for family-level entries. */
  parentId: string | null
  level: OpeningLevel
  openingType: OpeningType
  side: OpeningSide
  /** Navigation group; present on family entries only. */
  group?: OpeningGroup
  /** ECO codes or ranges, e.g. ["B90-B99"]. */
  eco?: string[]
  /** Canonical SAN move order from the start position; the validation gate
   *  replays it — positions are always derived, never hand-written. */
  moves: string
  tier: OpeningTier
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  /** Strategic themes, e.g. "pawn chains", "opposite-side castling". */
  themes?: string[]
  /** Recurring tactical motifs, e.g. "Greek gift", "exchange sac on c3". */
  motifs?: string[]
  /** Characteristic pawn structures, e.g. "Carlsbad", "Maroczy bind". */
  structures?: string[]
  /** Educationally related entries (catalog ids). */
  related?: string[]
  /** Entries reachable by transposition (directional; inverse is derived). */
  transposesTo?: string[]
  /** Standalone tiers only: the study teaching this opening. */
  lessonId?: string
  /** branch-only tier: the study whose lesson covers this name. */
  branchOfLessonId?: string
  /** Editorial rationale: tier judgment, naming, honest status of dubious lines. */
  notes?: string
}

/** A catalog entry enriched with everything derived at load time. */
export interface OpeningNode extends OpeningCatalogEntry {
  children: string[]
  transposesFrom: string[]
  /** Whether this entry's tier calls for its own lesson. */
  standalone: boolean
  /** 'available' when lessonId resolves to a shipped study. */
  lessonStatus: 'available' | 'planned' | 'none'
}
