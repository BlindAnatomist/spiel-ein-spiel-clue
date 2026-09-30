# Checkpoint 1: headless deduction foundation

Status: implemented and locally verified, 2026-09-29 America/Chicago.

## Repository inspection

The remote repository had no refs or commits. A local uncommitted TypeScript scaffold was present. It was inspected, completed with contract tests and project documentation, and reviewed before the initial commit. No Euchre code or rules were imported.

## Implemented

- Strict TypeScript domain types and abstract configurable content.
- Seeded hidden solution, shuffled round-robin evidence distribution, player order, and starting locations.
- Trusted referee with validated structured actions and explicit turn/refutation/finished phases.
- Directed graph movement, local suggestions, mandatory ordered refutation, selectable private reveals, turn completion, and final accusations.
- Detached per-player views, bound player ports, independent conservative notebook projections.
- Public/private/referee ledger projections and versioned command replay.
- Deterministic baseline bot with actual machine-readable decision reasons.
- Bounded headless bot simulation, command-line public outcome summary, strict typechecking, and CI configuration.

See FOUNDATION.md for rules and information boundaries; source and executable tests are authoritative when evolving this checkpoint.

## Verification

Commands from repository root:

```sh
npm ci
npm run check
npm run simulate -- checkpoint-1
```

All 19 contract tests pass. The suite checks setup partitions over 100 seeds; hidden-state exclusion; immutable views and actor-bound ports; legal action rejection without mutation; refutation order and multiple-card selection; reveal privacy and notebook provenance; all-pass behavior without human auto-solving; graph movement; successful and failed accusations; continued refutation by eliminated players; no-winner termination; historical event prefixes; exact archive replay; deterministic policy behavior; and baseline completion across 30 seeds. Additional regressions compare different private reveal choices from the same state and pin a complete reference-game ledger digest. A clean `npm ci`, strict typechecking, and the reference simulation also passed.

Reference simulation: `checkpoint-1` finishes with investigator-b winning in 62 accepted actions over 16 turns. Local verification uses Node.js 24.19.0. CI is configured to run `npm ci`, `npm run check`, and that simulation on pushes and pull requests; local results do not assert a remote CI result.

## Deliberate limitations

- No browser interface or VoiceOver testing yet; no final fiction, dialogue, audio, external TTS, or LLM calls.
- Fixed core categories; variable card counts, players, and graph. Adding a new core category requires explicit type/rule evolution.
- Eager enumeration of legal hypothesis triples and ledger-derived notebooks favor inspectability over large-game performance. Ledger/archive retention is in memory, with no storage or network authentication layer.
- Baseline policy is a deterministic candidate tester, not an optimal investigator. No difficulty levels, probabilistic inference, or richer personalities.
- Graph must currently be strongly connected; conditional routes, locks, and movement costs are deferred.
- Referee authority is an API/capability boundary, not hostile-code isolation. A human with complete local host access can inspect referee secrets; future hosting must choose its threat model explicitly.
- Rules version is checked on replay. Archive migration, external archive schema validation, tamper detection, and polished historical state/replay controls are deferred.

## Recommended next checkpoint

Build a minimal semantic browser adapter for one human and baseline bots, with text-only narration and explicit pacing. Use native grouped selectors for hypothesis components, buttons for legal movement/reveal actions, a concise announcement region, and persistent transcript/notebook/state review. Keep bot turns pausable and step-controlled. Make the same adapter capable of public and follow-player observation using filtered events.

Test the actual flow on iPhone with VoiceOver: initial state, action selection, mandatory refutation interruption, multiple reveal choices, returning focus, transcript review, failed accusation, and game completion. Resolve those interaction contracts before adding fictional content, richer bots, or audio presentation.
