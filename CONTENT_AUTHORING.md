# KnightNotes Content Authoring Guide

This document is the complete, stable interface for adding studies to
KnightNotes. Authors never touch the application's internal node
representation — you write a **StudySeed** file (moves plus teaching notes),
and the application compiles it into its canonical position tree,
generating node IDs, FEN positions, plies, and parent/child relationships
automatically, validating both the file's shape and the chess itself.

```
StudySeed JSON  →  schema validation  →  chess replay (legality + FENs)  →  canonical Study  →  reader
   (you)             (validateSeed)          (seedToStudy)
```

## Quick start

1. Create `src/content/<category>/<id>.json` — categories are `games/`,
   `openings/`, `gambits/`, `traps/`, `tactics/`, `endgames/`.
2. Write the seed (format below). The file name must match the `id`.
3. Validate: `npm run validate:content`. Errors name the exact field or
   move (`line[8].annotations[0].body: …`) or the exact illegal move.
4. Done. The study appears in the library automatically — there is no
   registration step.

## The format

### Minimal valid study

```json
{
  "id": "my-study",
  "title": "My Study",
  "type": "trap",
  "summary": "One to three sentences shown on the library card.",
  "concepts": ["pins"],
  "line": ["e4", "e5", "Nf3", "Nc6", "Bc4"]
}
```

Moves are standard SAN, played in order from the standard starting
position (or from `initialFen` if given). A bare string is a move with no
commentary; use an object when a move carries teaching content:

```json
"line": [
  "e4",
  "e5",
  { "san": "Nf3",
    "annotations": [{ "type": "principle", "body": "Develops and attacks e5." }] }
]
```

### All fields

| Field | Required | Notes |
|---|---|---|
| `id` | yes | kebab-case, matches the filename |
| `title` | yes | shown everywhere |
| `type` | yes | `game` `opening` `variation` `gambit` `trap` `tactic` `endgame` `pattern` |
| `line` | yes | array of moves (strings or objects) — the main line |
| `summary` | effectively yes | required by the quality gate |
| `concepts` | effectively yes | at least one, e.g. `"weak f7"` |
| `catalogCode` | no | `"G001"`, `"TR002"`… — orders the library within its category |
| `focus` | no | `"white"` or `"black"` — the side this study teaches for (Italian → white, Caro-Kann → black). Shows a badge on the library card and the study opens with that side at the bottom of the board. **Omit** for color-agnostic content (full games, most patterns and endgames) |
| `subtitle` | no | one line under the title |
| `difficulty` | no | `beginner` `intermediate` `advanced` |
| `tags` | no | free strings |
| `metadata` | no | `white`, `black`, `event`, `site`, `date`, `result`, `eco`, `opening`, `historicalContext` |
| `initialFen` | no | ONLY for studies not starting at move 1 (endgames, patterns) |
| `rootAnnotations` | no | annotations shown before any move is made |
| `rootVisual` | no | visual annotations on the starting position |
| `description` | no | longer prose, not currently displayed prominently |

### Move objects

| Field | Notes |
|---|---|
| `san` | required — exact SAN: `Nf3`, `O-O`, `exd5`, `e8=Q`, `Nbd2` when disambiguation is needed. `+`/`#` are normalized for you |
| `classification` | `interesting` `critical` `theory` `forced` `mistake` `blunder` `sacrifice` `novelty` — shown as a label on the move |
| `importance` | `notable` `important` `critical` — visual emphasis; use `critical` 1–3 times per study |
| `annotations` | array of annotation objects (below) |
| `visual` | array of board markers (below) |
| `variations` | array of alternative **lines** — each an array of moves that **replaces this move** (an alternative for the same side) and continues from there. Nesting is supported |

### Annotations

```json
{ "type": "key-idea", "title": "Short noun phrase", "body": "1–4 sentences.", "concepts": ["optional"] }
```

Types: `commentary` `question` `key-idea` `critical-position` `principle`
`warning` `historical` `mistake` `strategy` `tactic`.

`question` builds anticipation: put it on the move **before** a critical
moment ("What would you expect Black to do here?"), and the answer on the
critical move itself.

### Visual annotations

```json
{ "type": "square", "square": "f7" }
{ "type": "arrow", "from": "c4", "to": "f7" }
```

Use them where seeing beats reading: the attacked square, the pin line,
the king's path, the promotion square.

## Validation

`npm run validate:content` (also part of `npm test`, which gates every
deploy) enforces three layers:

1. **Schema** — required fields, enum values, square names, FEN shape;
   errors carry the exact path (`line[8].variations[0][1].san: …`).
2. **Chess legality** — every move of every line is replayed through the
   rules engine from its parent position. An illegal move fails with the
   move, move number, and the position it was attempted from. This is
   also why authors never write FENs: they are generated, so they cannot
   be wrong.
3. **Quality gate** — ≥5 mainline half-moves, ≥4 annotations with real
   bodies, non-empty `summary` and `concepts`, unique ids across the
   catalog.

What no validator can catch is **legal-but-wrong** chess — a plausible
move sequence that isn't the real game or the correct technique. For
historical games, verify the score against a reliable source; for
endgames, verify the method, not just the legality.

## Writing voice (what makes a study worth shipping)

Write for a beginner-to-intermediate adult who knows the rules and wants
to understand **why**. Never narrate the visible ("White plays Nf3").
Explain purpose, threats, principles, what a beginner would overlook, why
a sacrifice works. At critical moments answer: what changed? what's the
threat? what should the student notice before the next move?

Annotate the moments that matter and stay silent on routine moves — a
17-move game might carry 8–12 annotated moves. Silence is a feature.

## Complete example — `src/content/traps/legal-trap.json`

A real shipped study, showing metadata, root annotation, classifications,
visual markers, and a variation with its own annotations:

```json
{
  "id": "legal-trap",
  "catalogCode": "TR002",
  "title": "Légal's Trap",
  "subtitle": "Philidor Defense",
  "type": "trap",
  "difficulty": "beginner",
  "summary": "White offers the queen to expose a hidden mating net, punishing Black for grabbing material instead of finishing development.",
  "tags": ["Philidor Defense", "Italian Game", "mating attack"],
  "concepts": ["pins", "sacrifice", "checkmate patterns", "king safety"],
  "rootAnnotations": [
    {
      "type": "historical",
      "title": "Named after Sire de Légal",
      "body": "This trap is named for the 18th-century French master Sire de Légal, said to have sprung it on an overconfident opponent. It shows that a pin is only as strong as what's actually behind the pinned piece."
    }
  ],
  "line": [
    "e4",
    "e5",
    "Nf3",
    "d6",
    "Bc4",
    {
      "san": "Bg4",
      "annotations": [
        {
          "type": "warning",
          "title": "A pin with nothing behind it",
          "body": "This looks like a standard pin of the knight to the queen, but the black king is on e8, not on the d1-h5 diagonal. It is only a relative pin — the knight is free to move if something bigger is at stake."
        }
      ],
      "visual": [{ "type": "arrow", "from": "g4", "to": "d1" }]
    },
    "Nc3",
    "g6",
    {
      "san": "Nxe5",
      "classification": "sacrifice",
      "importance": "critical",
      "annotations": [
        {
          "type": "tactic",
          "title": "Offering the queen",
          "body": "White ignores the 'pin' and grabs a pawn, apparently hanging the queen to Bxd1. But the real point is a forced mate — the queen is worth less than what follows it."
        }
      ],
      "visual": [{ "type": "square", "square": "e5" }]
    },
    {
      "san": "Bxd1",
      "classification": "blunder",
      "importance": "critical",
      "annotations": [
        {
          "type": "mistake",
          "title": "The greedy capture",
          "body": "Taking the queen looks winning, but it walks straight into a forced mate. Black should have recaptured the knight instead of grabbing material — see the alternative line."
        }
      ],
      "variations": [
        [
          {
            "san": "dxe5",
            "annotations": [
              {
                "type": "key-idea",
                "title": "The safe, correct choice",
                "body": "Simply recapturing the knight is right. After 6.Qxg4 White has only won a pawn for the trouble — a small, normal edge instead of a forced loss."
              }
            ]
          },
          "Qxg4"
        ]
      ]
    },
    {
      "san": "Bxf7+",
      "classification": "critical",
      "annotations": [
        {
          "type": "tactic",
          "title": "Dragging the king out",
          "body": "With the queen gone, White's remaining pieces do the real work. This check forces the king into the open, since nothing can capture or block on f7."
        }
      ],
      "visual": [{ "type": "arrow", "from": "c4", "to": "f7" }]
    },
    {
      "san": "Ke7",
      "classification": "forced",
      "annotations": [
        {
          "type": "commentary",
          "title": "The only legal move",
          "body": "Kxf7 runs into the knight on e5, which guards f7; that same knight also covers d7, and f8 is occupied by Black's own bishop. Ke7 is forced."
        }
      ]
    },
    {
      "san": "Nd5#",
      "importance": "critical",
      "annotations": [
        {
          "type": "tactic",
          "title": "The mating net",
          "body": "The knight from c3 delivers mate: it covers e7, d7, and f6, the bishop on f7 covers e6 and e8, and Black's own queen and bishop block the rest. There is no escape."
        }
      ],
      "visual": [
        { "type": "square", "square": "e7" },
        { "type": "square", "square": "d7" },
        { "type": "square", "square": "f6" },
        { "type": "arrow", "from": "c3", "to": "d5" }
      ]
    }
  ]
}
```

(The shipped file spells the unannotated moves as objects — both forms
are equivalent; strings are preferred for new content.)

## For maintainers

- Types and compiler: `src/infrastructure/content/seed.ts` (`StudySeed`,
  `seedToStudy`) — the only place authoring structure is interpreted.
- Schema validation: `src/infrastructure/content/validateSeed.ts`.
- Catalog gate: `src/infrastructure/content/__tests__/bundledContent.spec.ts`.
- The seed is an **interchange format like PGN** — never the runtime
  model. The canonical `Study` (`src/domain/study/types.ts`) stays the
  single source of truth, and future tooling (AI study generation, a
  visual editor) should emit seeds, not Studies.
