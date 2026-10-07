# Continuation: browser checkpoint and confirmed narrative direction

Authoritative repository: BlindAnatomist/spiel-ein-spiel-clue.
Active branch: feat/guided-browser-checkpoint.
Pull request: https://github.com/BlindAnatomist/spiel-ein-spiel-clue/pull/1.

## Current narrative instruction

Read docs/NARRATIVE_DIRECTION.md first.

On 2026-10-06 the user requested a clean-sheet rebuild rather than repairing the Vaudrey world. After the Bellwether proposal, the user clarified that the first version had more of the intended steampunk-meets-Wilkie-Collins feel, and agreed that the rebuild had lost theatricality, menace, eccentricity and domestic intrigue through excessive restraint.

Current confirmed direction: retain sound causal construction while recovering the original genre ambition. Working machinery should participate in household life. Characters need concrete wants, pleasure, charm, absurdity, varied relationships and potentially dangerous attachments, not merely positions in a debate about archival authority.

The same planned 21-card game remains underneath: six suspects, six methods, nine locations; one hidden from each category and eighteen dealt to three investigators. The Bellwether concealment-object substitution was not approved. Do not implement it or treat it as the required second category. Narrative rebuilding does not authorize new rules, a fourth mystery category, mandatory psychological clue interpretation or a separately scripted case for every deal.

The new direction is confirmed; a third cast, final house name, exact crime and replacement plot are not yet approved. A compact household premise and ensemble scene are recommended creative tests before locking another extensive cast document. These are proposed next work, not completed artifacts. The tone illustration in NARRATIVE_DIRECTION.md is not production dialogue or fixed case evidence.

## Earlier explorations and verification boundaries

WORLD_AND_CAST.md and NARRATIVE_LOGIC_AUDIT.md preserve the Vaudrey exploration and its audit. The first draft's atmosphere remains useful; its biographies and secrets are not automatically restored. Do not resume repairing that cast solely because it is extensively documented.

BELLWETHER_REBUILD.md preserves a later, unapproved proposal. Its living superintendent, flood history, archive handover, cast and concealment objects are not mandatory for the next version. Earlier statements that it should be read first are superseded by NARRATIVE_DIRECTION.md and the current user instruction.

The audit remains useful as a record of failure modes: custody gaps, chronology, overlapping methods, unsupported knowledge, forced moral symmetry, unsafe narrative clues and content/save integration. Applying those checks should not strip away the requested genre or expand the card game into a different kind of investigation.

Earlier graph calculations concerned particular proposals only. Bellwether's graph had nine rooms, twelve bidirectional links, maximum shortest-path distance three and average distance two. Vaudrey's different graph had its own recorded properties. Neither map is automatically adopted, and neither calculation established gameplay balance. All 324 narrative combinations remain unvalidated.

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
- Fresh fictional development under docs/NARRATIVE_DIRECTION.md, with proposals distinguished from approved cast and case content.

Preserve the small scripted practice. All current browser modes share app/content.ts; installing a full pack by replacing that object would also affect tutorial behavior and save restoration. Full-game integration needs explicit pack selection, pack-aware labels, stable identifiers and versioned save compatibility, with corresponding tests. This is not permission to rebuild the rules engine.

The narrative direction and routing updates are documentation only. They change no code, active game content, saved progress, audio, image assets or deployment. Neither the 324 narrative combinations nor real-device usability has been certified.

If interrupted, read the current branch head and this record before continuing. Keep proposals, user approvals, implemented content, historical tests and current deployment state distinct. Do not claim an old branch snapshot is current without checking it.
