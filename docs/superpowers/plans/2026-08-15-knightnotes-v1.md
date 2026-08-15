# KnightNotes V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship KnightNotes V1 — a local-first Vue 3 chess-study reader with a tree-capable Study model, PGN import with variations, bundled annotated studies, and full test coverage.

**Architecture:** Four layers (presentation → application → domain → infrastructure) with pure-function domain traversal, chess.js behind an app-owned engine boundary, a custom RAV-aware PGN parser, repository-abstracted persistence (bundled JSON + IndexedDB), and Pinia session/library stores.

**Tech Stack:** TypeScript, Vue 3 (Composition API), Vite, vue-router, Pinia, chess.js, idb, Vitest, @vue/test-utils, happy-dom.

**Spec:** `docs/superpowers/specs/2026-08-15-knightnotes-v1-design.md`

## Global Constraints
- Product name **KnightNotes**, tagline **"Chess, explained move by move."** in app title, `<title>`, README, UI nav.
- No server, auth, or cloud. No GPL dependencies. Stockfish and all §"Deferred" features out of scope.
- Presentation components never import chess.js, idb, or repository implementations directly.
- Domain layer has zero runtime dependencies (pure TS).
- Bundled and imported studies share one canonical JSON schema (the `Study` type).
- Keyboard shortcuts disabled while focus is in inputs/textareas/contenteditable.
- All bundled content must pass the content validator (legal SANs, FEN chain integrity, referential integrity).

---

### Task 1: Domain types + traversal (pure)
**Files:** `src/domain/study/types.ts`, `src/domain/study/traversal.ts`, `src/domain/study/summary.ts`, tests in `src/domain/study/__tests__/traversal.spec.ts`.
**Produces (contract for all later tasks):**
- All spec types verbatim (`Study`, `StudyNode`, `ChessMove`, `Annotation`, `VisualAnnotation`, `StudyType`, `Difficulty`, `StudyMetadata`, `MoveClassification`, `ImportanceLevel`) plus `StudySummary { id, slug, title, subtitle?, type, difficulty?, concepts, tags, metadata?, source }` where `source: 'bundled' | 'local'`.
- `getNode(study, id): StudyNode` (throws on missing), `pathToNode(study, id): string[]` (root→id inclusive), `nextNodeId(study, id, selectedChildId?): string | null` (selected → preferred → first child), `prevNodeId`, `mainlineEndId(study, fromId)`, `mainlineIds(study): string[]` (root-following preferred), `variationsAt(study, id): StudyNode[]` (children beyond the mainline child), `moveRows(study, lineIds): MoveRow[]` for two-column notation (`MoveRow { number, whiteNodeId?, blackNodeId? }`).
Tests: linear traversal, branching with preferredChildId, first-child fallback, ends, pathToNode on nested variation, moveRows pairing incl. Black-to-move-first lines (FEN start).

### Task 2: ChessEngine wrapper (infrastructure)
**Files:** `src/infrastructure/chess/engine.ts`, tests.
**Produces:** `createEngine(fen?)` returning `{ fen(): string, move(san): MoveDetail | null, isLegal(san): boolean, turn(): 'white'|'black', moveNumber(): number }`; `MoveDetail { san, from, to, promotion?, side }` (san normalized by chess.js). `STARTING_FEN` const. Only this file (and pgn modules) import chess.js.

### Task 3: PGN tokenizer + parser (variation-aware)
**Files:** `src/infrastructure/chess/pgn/tokenize.ts`, `parse.ts`, tests.
**Produces:** `parsePgn(text): ParsedPgn` where `ParsedPgn { headers: Record<string,string>, moves: PgnMoveNode[], result?: string }` and `PgnMoveNode { san, comments: string[], nags: number[], variations: PgnMoveNode[][] }`. Handles headers, `{}` comments (before/after moves), `;` comments, NAGs (`$n`, `!`, `?` suffixes), nested RAVs, results, move numbers/ellipses. Throws `PgnParseError` with a diagnostic message on malformed input (unbalanced braces/parens, garbage tokens).

### Task 4: PGN → Study conversion
**Files:** `src/infrastructure/chess/pgn/toStudy.ts`, tests.
**Produces:** `pgnToStudy(pgn: string, opts?: { id?, type?: StudyType }): Study`. Replays moves through `createEngine` (from `[FEN]` header or start), builds node tree incl. variations (fork positions replayed from parent FEN), converts comments → `commentary` annotations, NAG `$1/$2/$4/$6` → classifications (`!`→interesting used as classification "interesting", `?`→mistake, `??`→blunder, `!?`→interesting, `?!`→interesting? map: $1 "!"→classification none/importance notable; keep simple: $2→mistake, $4→blunder, $1/$3→interesting). Title from White/Black headers else "Imported Study". Illegal move → `PgnParseError` naming the SAN and move number. Node ids deterministic (`n0`, `n1`, …). Sets `preferredChildId` to mainline child.
Tests: simple game, headers→metadata, comments→annotations, castling, promotion (`e8=Q`), check/checkmate suffixes, nested variations produce correct tree + FENs, malformed PGN throws, illegal move throws, FEN-start game.

### Task 5: Persistence + repositories
**Files:** `src/infrastructure/storage/localStudyRepository.ts`, `src/infrastructure/storage/preferences.ts`, `src/infrastructure/content/bundledStudyRepository.ts`, `src/infrastructure/content/compositeStudyRepository.ts`, `src/infrastructure/repository.ts` (interface + `toSummary`), tests (fake-indexeddb not needed: test Local against an in-memory idb substitute via dependency-injected db, or use happy-dom + idb with `fake-indexeddb` if trivial; otherwise unit-test Composite/Bundled and integration-test Local behind its own seam).
**Produces:** `StudyRepository` interface per spec (+ `source` tag on summaries); `bundledRepository` loads `src/content/**/*.json` via `import.meta.glob` (eager); `LocalStudyRepository` (idb store `studies`, db `knightnotes`); `CompositeStudyRepository(bundled, local)` — list merges (local may shadow by id), get checks local then bundled, save/delete go to local (deleting a bundled study is an error). `preferences.ts`: `getPref/setPref` JSON-in-localStorage with `kn:` prefix.

### Task 6: Application stores + keyboard
**Files:** `src/application/session/sessionStore.ts` (Pinia), `src/application/library/libraryStore.ts`, `src/application/import/importPgn.ts`, `src/application/keyboard/useStudyKeyboard.ts`, tests for stores and importPgn.
**Produces:** sessionStore state per spec (`studyId, currentNodeId, activePath, orientation, selectedVariation?` — plus `study` ref); actions `loadStudy(id)`, `next()`, `previous()`, `toStart()`, `toEnd()`, `goTo(nodeId)`, `selectVariation(nodeId)`, `returnToMainLine()`, `flip()`; getters `currentNode`, `currentFen`, `lastMove`, `annotations`, `visualAnnotations`, `variations`, `lineIds` (path through current node extended along preferred children — the displayed line), `canNext/canPrevious`, `onMainLine`. Orientation persisted via preferences; auto-orient to Black when study metadata suggests? No — default white, restore saved pref per study. `libraryStore`: summaries + category filter (category = StudyType groups: famous-games→game, openings→opening|variation, gambits→gambit, traps→trap, tactics→tactic|pattern, endgames→endgame). `importPgn(text): Promise<Study>` = parse → save to composite repo → return.
Keyboard: composable binding keydown per spec key table, guarded against editable targets, cleanup on unmount.

### Task 7: Board + presentation components
**Files:** `src/components/board/ChessBoard.vue`, `BoardControls.vue`; `src/components/notation/MoveList.vue`, `MoveNavigator.vue`, `CurrentMovePanel.vue`; `src/components/annotations/AnnotationPanel.vue`, `AnnotationCard.vue`; `src/components/variations/VariationSelector.vue`; `src/components/library/StudyCard.vue`, `StudyFilters.vue`; `src/components/AppShell.vue`; `src/styles/` tokens.
**Produces:** `ChessBoard` props `{ fen, orientation, lastMove?: {from,to}, highlights?: VisualAnnotation[] }` — SVG board (8×8, coordinates, piece images from `/pieces/*.svg`, last-move tint, highlight circles/squares, arrows with markers). Pure presentational; parses FEN placement locally (string split — no chess.js). MoveList renders `moveRows` with current/importance/mistake styling and branch indicator (⋯ marker when node has variations). Components consume the session store only via props/emits where practical; views wire stores.

### Task 8: Views, router, app shell
**Files:** `src/views/LibraryView.vue`, `StudyView.vue`, `ImportView.vue`; `src/router/index.ts`; `src/App.vue`, `src/main.ts`, `index.html`.
Routes `/`, `/study/:id`, `/import`. StudyView layout per spec §25 (board left, study panel right, navigator bottom; responsive stack). Error states: study not found; PGN error messaging. `<title>` = "KnightNotes — Chess, explained move by move."

### Task 9: Component/flow tests
**Files:** `src/__tests__/studyFlow.spec.ts`.
Mount StudyView (with router + pinia + seeded repo): open study → next advances FEN + annotation → previous → click move to jump → variation appears and selects → flip. Keyboard event tests.

### Task 10: Bundled content (parallel agents) + validator
**Files:** `src/content/<category>/*.json` (~14 studies), `docs/content-authoring.md`, `scripts/validate-content.mjs`, `src/infrastructure/content/__tests__/content.spec.ts`.
Validator: for every JSON study — schema shape, root exists, every node reachable, parent/child mutual, `moveFromParent.san` legal from parent FEN via chess.js and resulting FEN === node.fen, preferredChildId ∈ children, annotation quality lint (≥1 annotation per study, nonempty bodies). Runs in Vitest so `npm test` gates content.
Agents author content per `docs/content-authoring.md` (schema + voice guide + a worked example). Categories split across 4 parallel agents. I validate, fix, and spot-check pedagogy.

### Task 11: Polish + README + final verification
README (product identity, run instructions, architecture map, piece-set attribution CC-BY-SA cburnett/Wikimedia, license note), `npm run build` clean, full `npm test` green, run dev server and verify core flow, favicon (♞), commit history clean.
