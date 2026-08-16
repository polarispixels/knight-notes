# KnightNotes — Roadmap & Backlog

Living document: current state, deliberate deferrals, and next candidates.
(Product-level V2 scope lives in DESIGN_SPEC.md "Deferred features".)

## Current state (2026-08-16)
- 89 bundled studies across 7 categories: Famous Games G001–G022,
  Openings O001–O012, Gambits GB001–GB007, Traps TR001–TR013,
  Tactics/Patterns TA001–TA013, Endgames E001–E012, Concepts C001–C010.
- Live at https://polarispixels.github.io/knight-notes/ (GitHub Pages,
  deploy gated by the full test suite on push to main). Docs at /docs/.
- 219 automated tests; content gate replays every move of every study.

## Engineering backlog (deliberate, not forgotten)
- **Lazy-load bundled content**: all studies ship inside the JS bundle
  (~650KB pre-gzip, chunk-size warning at build). Move to dynamic
  import.meta.glob (non-eager) + per-study fetch before the library
  doubles again. The bundledStudyRepository seam is where this lands.
- **PWA/offline**: natural V1.1 (app is already local-first); ~small task.
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
