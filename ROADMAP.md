# KnightNotes — Roadmap & Backlog

Living document: current state, deliberate deferrals, and next candidates.
(Product-level V2 scope lives in DESIGN_SPEC.md "Deferred features".)

## Current state (2026-08-16, post openings-library)
- 239 bundled studies across 7 categories: Famous Games G001–G022,
  Openings O001–O144, Gambits GB001–GB025, Traps TR001–TR013,
  Tactics/Patterns TA001–TA013, Endgames E001–E012, Concepts C001–C010.
- Opening Catalog (src/data/openings-catalog.json): ~225 curated entries,
  ~170 standalone lessons, branch-only and honestly-excluded tiers, 290
  aliases; /openings browser with alias search and side filtering; catalog
  gate replays every canonical move order.
- Bundled studies lazy-load: build-time summary projection
  (virtual:study-summaries) + per-study chunks; main bundle ~262KB.
- Live at https://polarispixels.github.io/knight-notes/ (GitHub Pages,
  deploy gated by the full test suite on push to main). Docs at /docs/.
- 600+ automated tests; content gate replays every move of every study.

## Engineering backlog (deliberate, not forgotten)
- **PWA/offline**: natural V1.1 (app is already local-first); ~small task.
- Openings browser refinements: collapse/expand for large families,
  tier badges, and linking branch-only rows to the exact in-lesson branch.
- Code-review deferrals (2026-08-15): seed.ts/toStudy.ts builder
  duplication (~40 lines, both tested — unify only with a reason);
  sessionStore recompute/localStorage micro-perf; ChessBoard unguarded-FEN
  render is guarded, full IDB record schema validation still light.
- GH Pages serves SPA deep links via 404.html with HTTP status 404
  (renders fine; cosmetic; would vanish on Netlify/Cloudflare).

## Content candidates (sequels the catalog sets up)
- "Closed Ruy Lopez Plans" (the Nb1–d2–f1–g3 middlegame the O003 study
  points at); French middlegame plans; more Black-side gambits;
  Smyslov/Kramnik-era famous games (era balance); more beginner-level
  concept studies (current concepts skew intermediate).

## Product V2 (from DESIGN_SPEC; do not start as side effects)
Learn mode ("What would you play here?" — the `question` annotation type
is the hook), Test mode, manual piece movement, Stockfish, spaced
repetition, accounts/sync, AI study generation (must emit StudySeeds).
