# KnightNotes Content Authoring Guide

Bundled studies are **StudySeed** JSON files in `src/content/<category>/<id>.json`.
Moves are SAN; the app replays them through the rules engine, so FENs are never
hand-written. A seed with an illegal move fails the test suite and cannot ship.

## Directories
`src/content/games/` `openings/` `gambits/` `traps/` `tactics/` `endgames/`

## Schema

```jsonc
{
  "id": "opera-game",              // kebab-case, matches filename
  "title": "The Opera Game",
  "subtitle": "Morphy vs Duke Karl & Count Isouard, Paris 1858",  // optional
  "type": "game",                  // game|opening|variation|gambit|trap|tactic|endgame|pattern
  "difficulty": "beginner",        // beginner|intermediate|advanced
  "summary": "1–3 sentences shown in the library card and study header.",
  "tags": ["Philidor Defense", "development"],
  "concepts": ["development", "pins", "back-rank weakness"],
  "metadata": {                    // optional; for games: white/black/event/date/result; eco/opening for openings
    "white": "Paul Morphy", "black": "Duke Karl / Count Isouard",
    "event": "Paris Opera House", "date": "1858", "result": "1-0",
    "historicalContext": "optional short paragraph"
  },
  "initialFen": "…",               // ONLY for positions not starting at move 1 (endgames, patterns)
  "rootAnnotations": [             // optional; shown before any move is made
    { "type": "historical", "title": "…", "body": "…" }
  ],
  "rootVisual": [],                // optional visual annotations on the start position
  "line": [                        // the main line, one entry per half-move
    {
      "san": "e4",                                    // REQUIRED. Standard SAN: e4, Nf3, O-O, exd5, e8=Q, Qxf7#
      "classification": "sacrifice",                  // optional: normal|interesting|critical|theory|forced|mistake|blunder|sacrifice|novelty
      "importance": "critical",                       // optional: normal|notable|important|critical
      "annotations": [                                // optional; MOST moves should have none
        { "type": "key-idea", "title": "…", "body": "…", "concepts": ["…"] }
      ],
      "visual": [                                     // optional board markers for THIS position
        { "type": "square", "square": "f7" },
        { "type": "arrow", "from": "c4", "to": "f7" }
      ],
      "variations": [                                 // optional: alternative lines REPLACING this move
        [ { "san": "d6", "annotations": [ … ] }, { "san": "d4" } ]
      ]
    }
  ]
}
```

Annotation types: `commentary` `key-idea` `critical-position` `principle` `warning` `historical` `mistake` `strategy` `tactic`.

## Chess correctness (non-negotiable)
- Every SAN must be legal in sequence from the start position. Use exact SAN
  (`Nbd2` when disambiguation is needed, `#` for mate is normalized for you).
- For famous games, verify the score against a reliable source — do not trust
  memory for long games. A legal-but-wrong move sequence is the worst failure
  mode because tests can't catch it.
- A variation entry replaces the move it is attached to (it's an alternative
  for the same side), and continues from there.
- Validate your work: `npx vitest run src/infrastructure/content` — must pass.

## Pedagogy (what makes this product worth using)
Write for a beginner-to-intermediate adult who knows the rules and wants to
understand **why**. Never narrate the visible ("White plays Nf3"). Explain
purpose, threats, principles, what a beginner would overlook, why a sacrifice
works. At critical moments answer: what changed? what's the threat? what should
the student notice before the next move?

- Annotate the moments that matter; stay silent on routine moves. A 17-move
  game might have 8–12 annotated moves; a 40-move game maybe 15.
- Use `importance` to make big moments stand out (`critical` sparingly, 1–3
  per study), `classification` for mistakes/blunders/sacrifices/theory.
- Use `visual` squares/arrows where seeing the idea beats reading it
  (the attacked square, the pin line, the promotion path).
- Titles on annotations are short noun phrases ("The point of the sacrifice").
  Bodies are 1–4 sentences of plain, confident prose.
- Give openings/traps real variations (what happens if the defender plays the
  natural-but-wrong move; what the punished line looks like).
- Endgames/patterns start from an `initialFen` and should teach the method
  step by step (e.g. building the bridge in the Lucena).

## Quality gate (enforced by tests)
≥5 mainline half-moves; ≥4 annotations, each body >10 chars; nonempty
`summary` and `concepts`; unique ids. Beyond the gate: make every annotation
earn its place.
