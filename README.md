# ♞ KnightNotes

**Chess, explained move by move.**

KnightNotes is a browser-based interactive chess textbook. Open a study, press
Next, and step through famous games, openings, gambits, traps, tactics, and
endgames — with educational commentary at the moments that matter, and
explorable variations where the story branches.

It is a local-first reader: no server, no account, no analysis engine. Bundled
studies ship with the app; your own games can be imported from PGN and are
stored in your browser.

## Running

```bash
npm install
npm run dev      # development server
npm test         # full test suite (domain, PGN, persistence, UI, content validation)
npm run build    # production build to dist/
```

## Using it

- **Library** (`/`) — browse studies, filter by category.
- **Study reader** (`/study/:id`) — the board, the current move, and its
  commentary. Navigate with the buttons, the move list, or the keyboard:
  `→`/`Space` next · `←` previous · `Home`/`End` jump · `F` flip board.
  When a position has alternative lines, they're offered under the
  commentary; select one to follow it, and return to the main line anytime.
- **Import** (`/import`) — paste any PGN (headers, comments, and variations
  are preserved) and it becomes a study in your library.

## Architecture

Four strictly separated layers (see `docs/superpowers/specs/` for the full spec):

```
src/
  domain/study/          canonical Study model + pure traversal (zero dependencies)
  application/           Pinia stores: session (navigation), library, import, keyboard
  infrastructure/
    chess/               chess.js behind an app-owned ChessEngine boundary
    chess/pgn/           variation-aware PGN parser + PGN→Study conversion
    content/             StudySeed authoring format + bundled repository
    storage/             IndexedDB repository (idb) + localStorage preferences
  components/ views/     presentation only — no parsing or persistence logic
  content/               bundled studies (StudySeed JSON, engine-validated)
```

Key design decisions:

- **Studies are trees.** Every study — game, opening, trap — is one Study
  model: a tree of positions with a preferred main line. Variations are
  first-class from day one; the UI keeps branching simple on purpose.
- **PGN and StudySeed are interchange formats, never the internal model.**
  Both are replayed through the rules engine, so every FEN in the app is
  engine-generated and every bundled study is machine-validated by the test
  suite (`src/infrastructure/content/__tests__/bundledContent.spec.ts`).
- **Repositories abstract storage.** `BundledStudyRepository` (shipped JSON),
  `LocalStudyRepository` (IndexedDB), and `CompositeStudyRepository` sit
  behind one interface; a future API-backed repository slots in without
  touching the reader.

## Authoring content

Bundled studies are human-readable JSON seeds in `src/content/<category>/` —
SAN moves plus structured annotations; positions are computed, never
hand-written. See `docs/content-authoring.md` for the schema, the chess
correctness rules, and the pedagogical voice guide.

## Credits & licensing

- Chess rules and PGN move validation: [chess.js](https://github.com/jhlywa/chess.js) (MIT).
- Chess piece images: the standard "cburnett" set by Colin M.L. Burnett, via
  Wikimedia Commons, licensed CC-BY-SA 3.0 / GFDL (`public/pieces/`).
- IndexedDB wrapper: [idb](https://github.com/jakearchibald/idb) (ISC).
