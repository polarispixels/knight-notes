# KnightNotes — V1 Design Specification

**Tagline:** Chess, explained move by move.

Browser-based chess study application for a single adult student: an **interactive chess textbook**, not a gaming platform. Core loop: open a study → see the position → Next/Next/Next → read commentary at moments that matter → explore variations. The app answers "what is happening here, and why does this move matter?"

Guiding standard (§45 of source spec): the user should think *"I finally understand why that move mattered."* Prefer clearer explanation over more functionality; readability over visual complexity; clean extensible models over shortcuts.

## Primary user
Single adult student; knows the rules; beginner-to-intermediate; values explanation over engine evaluation; desktop-first, must work on tablet/phone. No accounts, no server, no auth in V1.

## V1 Scope

### Board
- Render arbitrary legal positions; advance automatically as study progresses.
- Both orientations + flip (F key).
- Indicate previous move; support instructional square highlights and arrows (read-only, defined in content).
- No manual piece movement in V1.

### Navigation
Previous / Next / Beginning / End / click-a-move-to-jump / keyboard:
Right+Space=Next, Left=Previous, Home=Beginning, End=End, F=Flip, Escape=close modal. Shortcuts must not fire inside text fields.

Semantics: **Previous** → parent node. **Next** → active selected variation, else `preferredChildId`, else first child, else stay. **Beginning** → root. **End** → follow preferred children to end of main line.

### Library
Filterable by category (Famous Games / Openings / Gambits / Traps / Tactics / Endgames — extensible without architecture changes). Cards show title, subtitle, type, difficulty, concepts, players/year where applicable. Search optional; category filter required.

### Study reader
Visual priority: 1 board, 2 current move, 3 explanation, 4 notation, 5 secondary metadata.

## Domain model (canonical)

Study types: `game | opening | variation | gambit | trap | tactic | endgame | pattern` — all sharing ONE Study engine. Studies are **trees** of positions from V1 (essential for openings/traps/gambits); UI shows a simple "alternative lines from this position" list, not a graphical tree. Principle: *tree-capable engine, simple branch interface.* Nested variations supported.

```typescript
Study { id, slug, title, subtitle?, type: StudyType, description?, summary?,
  difficulty?: "beginner"|"intermediate"|"advanced", tags: string[], concepts: string[],
  source?, metadata?: StudyMetadata, initialFen?, rootNodeId, nodes: Record<string, StudyNode>,
  createdAt?, updatedAt? }

StudyMetadata { white?, black?, event?, site?, date?, result?, eco?, opening?, historicalContext? }

StudyNode { id, fen, parentId?, moveFromParent?: ChessMove, ply, annotations?: Annotation[],
  visualAnnotations?: VisualAnnotation[], children: string[], preferredChildId? }

ChessMove { san, from?, to?, promotion?, moveNumber?, side: "white"|"black",
  classification?: "normal"|"interesting"|"critical"|"theory"|"forced"|"mistake"|"blunder"|"sacrifice"|"novelty",
  importance?: "normal"|"notable"|"important"|"critical" }

Annotation { id, type: "commentary"|"key-idea"|"critical-position"|"principle"|"warning"|"historical"|"mistake"|"strategy"|"tactic",
  title?, body, concepts?: string[] }

VisualAnnotation = { type:"square", square, style? } | { type:"arrow", from, to, style? }
```

Classifications are educational metadata supplied by content, never inferred. UI distinguishes important/critical moves without making normal moves noisy.

## Opening Catalog (added 2026-08-16)

The openings library is organized by an application-owned **Opening
Catalog** (`src/data/openings-catalog.json`, types in
`src/domain/openings/types.ts`): the curated editorial map of opening
theory. Catalog entries carry identity (canonical name, aliases), taxonomy
(`level`: family/opening/variation/subvariation; `openingType`; `side`;
navigation `group` on families), classification (ECO, editorial `tier`),
relationships (tree `parentId` plus graph `transposesTo`/`related` — chess
openings transpose, so the tree is for navigation and the graph edges keep
what the tree cannot express), and lesson wiring (`lessonId` /
`branchOfLessonId`). Instructional content stays in studies; the catalog
only points at them.

Rules: one canonical name per opening, alternates are searchable aliases;
`children`/`transposesFrom`/`lessonStatus` are derived at load, never
stored; positions are derived by replaying each entry's canonical `moves`
(hand-written FENs remain a bug); editorial tiers are
core / major / specialized / historical (standalone lessons) plus
branch-only (taught inside a parent lesson) and excluded (kept only so
search can answer honestly — e.g. searching "Bongcloud" explains why there
is no lesson). The catalog gate
(`src/application/openings/__tests__/openingsCatalog.spec.ts`) validates
identity, hierarchy acyclicity, ECO formats, move legality, and lesson
wiring; it runs in `npm run validate:content`.

UI: `/openings` (lazy route) renders group → family → variation trees with
alias-aware search and White/Black filtering, joining catalog entries to
shipped lessons via the repository. The flat library at `/` is unchanged.

## PGN / FEN
PGN is an **interchange format**, never the internal model. Pipeline: PGN → parser → parsed game → conversion → Study → reader. Import must preserve headers, players, date, result, comments (→ annotations), main line, and variations. Unannotated imports are still valid studies. FEN supported internally; basic FEN import only if trivial. Import flow: validate → parse → build tree with FENs → comments become annotations → create Study with unique id → save locally → open. Title fallback: "White vs Black", else "Imported Study".

## Content sources & persistence
1. **Bundled studies**: human-readable, version-controlled **StudySeed** files (SAN moves + structured annotations; see CONTENT_AUTHORING.md). Like PGN, StudySeed is an authoring/interchange format — it is compiled (schema validation → chess replay → generated FENs/ids/relationships) into the canonical Study model at load time, so the reader consumes exactly one representation: `Study`.
2. **User-imported PGN**: parsed and stored locally.

Repository abstraction (UI never touches storage directly):
```typescript
interface StudyRepository { list(): Promise<StudySummary[]>; get(id): Promise<Study|null>;
  save(study): Promise<void>; delete(id): Promise<void> }
```
Implementations: Bundled, Local (IndexedDB), Composite; future Api. IndexedDB for studies; localStorage for prefs (orientation, last study/position, UI prefs).

## Architecture
Four layers, strictly separated: **Presentation** (board, layout, notation, cards, library, controls — no parsing/persistence logic) → **Application** (loading, navigation, current node/line, branch selection, orientation, import workflow) → **Domain** (Study, nodes, moves, annotations, traversal behavior) → **Infrastructure** (PGN parsing, FEN, chess rules library integration, persistence, bundled content, future API adapters).

Session state: `StudySession { studyId, currentNodeId, activePath: string[], orientation, selectedVariation? }`. Board position always derived from current node; Study model is the single source of truth.

Principles: strong typing, immutability where practical, pure functions for traversal/parsing/formatting/conversion, external libraries behind app-owned abstractions, domain testable without UI, extensibility by addition not replacement.

Chess rules via a mature library (chess.js) wrapped behind an app-owned `ChessEngine` boundary. Stockfish explicitly deferred.

Stack: TypeScript, Vue 3 (Composition API), Vite. Routes: `/` library, `/study/:id` reader, `/import`. Components stay small: AppShell, StudyLibrary, StudyCard, StudyFilters, StudyReader, ChessBoard, StudyHeader, MoveNavigator, MoveList, CurrentMove, AnnotationPanel, AnnotationCard, VariationSelector, StudyProgress, ImportPgnDialog, BoardControls.

## Visual direction
Modern interactive chess textbook: minimalist, calm, generous spacing, clear typography, restrained color, high board prominence, excellent readability. Avoid gaming/casino aesthetics, excessive animation, clutter, badges. Brand: `♞ KnightNotes — Chess, explained move by move.` Knight motif, restrained. Desktop-first; small screens stack vertically: title, board, navigation, annotation, notation, variations.

## Move list
Familiar two-column numbered notation; indicate current move (always obvious), important/critical moves, mistakes, branch markers. Restrained decoration.

## Content plan (~10–20 studies, quality over quantity)
Famous Games: Opera Game; Immortal Game; Byrne–Fischer 1956. Openings: Italian Game; Queen's Gambit. Gambits: King's Gambit; Benko. Traps: Fried Liver; Légal; Noah's Ark. Tactics: Greek Gift; back-rank patterns; discovered attack. Endgames: K+P fundamentals; Lucena; opposition.

**Quality standard:** annotations teach — never narrate the visible ("White plays Nf3"); explain purpose, threats, principles, what a beginner would overlook. Silence on moves that need no explanation. At critical moves answer: what changed, why it matters, what's the threat, what principle, why the sacrifice works.

## Error handling
Fail cleanly. Invalid PGN → "We couldn't parse this PGN. Check the notation and try again." Missing study → "Study not found." Nothing crashes the app; developer diagnostics logged, concise user messaging shown.

## Testing requirements
- Domain: traversal, parent/child, preferred line, branching, begin/end.
- PGN: simple games, headers, comments, castling, promotion, check(mate), variations, malformed input.
- Persistence: save/retrieve/delete, ID preservation.
- Application: next/prev/start/end, branch selection, flip.
- UI: core flow (library → open → next → annotation changes → previous → jump → variation) where practical.
- Content: every bundled study machine-validated (legal moves, FEN consistency, referential integrity).

## Editing policy & deferred features
V1 is a reader; bundled studies authored as source files; no visual editor. Deferred: manual movement, legal-move hints, move prediction, test mode, progress tracking, spaced repetition, Stockfish, eval bar, engine lines, AI generation, accounts, sync, sharing, collaboration. Future AI services must emit valid Study objects (structured content, never direct UI control). Future modes: Explore (V1), Learn, Test.

## Non-goals
Not a chess server, multiplayer game, social network, tournament platform, engine workstation, opening database, or a Chess.com/Lichess/ChessBase clone.

## Definition of Done (V1)
Library shows catalog → open study → correct position renders → Next advances board + notation + annotation → Previous returns → jump via move list → encounter and select a variation → follow it → return to main line → flip board → keyboard nav works → paste valid PGN → becomes locally stored study → reopenable from library → all without server/auth.

## Implementation decisions (recorded 2026-08-15)
- Vue 3 + Vite + TypeScript + vue-router + Pinia.
- chess.js (MIT) behind `ChessEngine`; custom RAV-aware PGN tokenizer/parser (chess.js's loader drops variations); chess.js validates moves and generates FENs.
- Custom read-only SVG board; cburnett piece SVGs (CC-BY-SA, attributed in README). No GPL board libraries.
- `idb` for IndexedDB; localStorage for prefs.
- Vitest + @vue/test-utils (happy-dom); bundled-content validator in the test suite.
- (2026-08-15, later) Bundled content authored as StudySeed (`src/infrastructure/content/seed.ts` + `validateSeed.ts`), never hand-written canonical Study JSON — FENs, node ids, and relationships are always generated. Format documented in CONTENT_AUTHORING.md; published with the app at `/docs/`.
- (2026-08-16) Bundled studies lazy-load: `virtual:study-summaries` (Vite plugin, `build/studySummariesPlugin.ts`) serves the library-card projection at build time; full studies convert on demand from per-study chunks (`lazyBundledRepository`). A content test pins the projection to `toSummary`.
- (2026-08-16) Opening Catalog shipped (see section above): 224 curated entries spanning ~170 standalone lessons; `/openings` browser; catalog gate in the test suite.
