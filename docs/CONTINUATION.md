# Continuation: browser checkpoint and fresh narrative direction

Authoritative repository: BlindAnatomist/spiel-ein-spiel-clue.
Active branch: feat/guided-browser-checkpoint.
Pull request: https://github.com/BlindAnatomist/spiel-ein-spiel-clue/pull/1.

## Current narrative instruction

On 2026-10-06, after reviewing the narrative audit, the user explicitly requested starting the world and characters again from scratch rather than repairing the earlier draft. Preserve the underlying deduction-game idea, not the former biographies and accumulated secrets.

Read docs/BELLWETHER_REBUILD.md first for the new proposal. It introduces Bellwether House, a living former superintendent, a disputed flood chronology, a recovered mechanical receiver record, six newly developed people and a proposed suspect/concealment-object/location case. It includes an initial history, pre-theft motives, sourced knowledge ledger, bounded custody outline, proposed rooms, a checked abstract route graph and remaining design questions.

Status distinction: the instruction to rebuild is user-authorized. The Bellwether particulars, including replacing stratagems with concealment objects in the existing method category, are proposed for user review. They are not approved final canon, implemented features or fully validated case combinations.

WORLD_AND_CAST.md and NARRATIVE_LOGIC_AUDIT.md remain historical records of the Vaudrey exploration. The prior world's status language does not override the later user instruction to reset. Do not continue patching its cast or import its secrets into Bellwether by default. The audit remains useful as a record of general design failure modes.

The immediate narrative task is to review and refine the new direction through concrete scene and case tests, not to fill every gap in the superseded story. Before content integration, decide the second category, specify object capacities and common custody steps, and validate the supported combinations without leaking case answers through fixed description or historical dialogue.

The new proposed walking graph has nine rooms and twelve bidirectional links. A breadth-first calculation found full connectivity, maximum shortest-path distance three and average distance two between distinct rooms. These are graph properties only: gameplay pacing and production staging remain untested. Do not confuse the new graph with the older Vaudrey graph described in the historical audit.

## Existing browser checkpoint: unchanged

Implementation commit: 6dda8834b083260d0c091001d4c8a6dec6019ede.
Main remains the headless checkpoint; browser work and these narrative documents are on the review branch. No merge or new deployment is implied.

Implemented: interactive real-engine practice, ordinary play, public/followed stepped observation, semantic manual UI, notebook/history review, explicit focus and confirmation, and validated local resume. Engine rules unchanged. Do not rebuild checkpoint 1 or repeat completed implementation.

Previously recorded verification: 27 engine/host tests, strict TypeScript, production build, original reference simulation, 9 local Chromium browser tests and all 18 Chromium/WebKit tests in remote CI. These are earlier application results, not tests run for the narrative reset. Actual iPhone VoiceOver acceptance remains pending.

Published preview record: https://deduction-practice.blind-anatomist.chatgpt.site
Reuse .openai/hosting.json; never create a replacement Site merely to continue this project. GitHub remains authoritative; the Site is a publishing mirror. Do not store publishing credentials in repository files.

Historical publication identifiers are in docs/CHECKPOINT_2.md and PR 1. This narrative work did not query a new hosting status or assert a new deployment.

## Parallel work and integration boundary

Two tracks may proceed independently:
- Actual iPhone VoiceOver acceptance of the existing guided checkpoint using docs/IPHONE_ACCEPTANCE.md.
- Review and development of the fresh Bellwether proposal using docs/BELLWETHER_REBUILD.md.

Preserve the small scripted practice. All current browser modes share app/content.ts; installing a full pack by replacing that object would also affect tutorial behavior and save restoration. Full-game integration needs explicit pack selection, pack-aware labels, stable identifiers and versioned save compatibility, with corresponding tests. This is not permission to rebuild the rules engine.

The rebuild and routing changes are documentation only. They changed no code, active game content, saved progress, audio, image assets or deployment. Neither the 324 narrative combinations nor real-device usability has been certified.

If interrupted, read the current branch head and this record before continuing. Keep proposals, user approvals, implemented content, historical tests and current deployment state distinct. Do not claim an old branch snapshot is current without checking it.
