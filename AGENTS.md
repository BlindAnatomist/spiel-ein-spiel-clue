# Agent entrypoint

This repository is the source of record for an original, blind-first deduction game. Start here, then follow the existing records below; do not create a second set of project instructions.

## Establish scope and authority

- Confirm the requested task, checked-out branch and commit, relevant PR base/head, permitted files, and stopping point before editing. Preserve concurrent changes.
- Read [README.md](README.md) for the branch's available features and commands, then [docs/FOUNDATION.md](docs/FOUNDATION.md) for rules, information boundaries, and the blind-first contract.
- [docs/CHECKPOINT_1.md](docs/CHECKPOINT_1.md) records the headless foundation and its evidence. Its recommended next checkpoint is historical; check the later browser work before proposing to build it again.
- On a browser checkpoint checkout, read `docs/CONTINUATION.md` for delivery/continuation, `docs/CHECKPOINT_2.md` for interaction and recovery contracts, and `docs/IPHONE_ACCEPTANCE.md` for the pending real-device walkthrough. If those files are absent, follow the pinned source links in README instead of assuming the work does not exist.
- Source and executable tests establish implemented behavior; foundation and checkpoint contracts establish intended behavior and acceptance limits. Reconcile a conflict with dated evidence rather than silently treating either as permission to change the other. Historical next steps do not resume paused work or authorize new feature production.

## Preserve the game's boundaries

- Keep rules independent of presentation. Preserve the trusted referee, detached allowlisted player views, filtered public/followed ledgers, and deterministic replay. Never expose seeds, archives, other players' hands, unauthorized private reveals, or bot reasoning through a player-facing surface. Do not claim adversarial secrecy for a local browser game.
- Keep fiction original and presentation labels outside the engine. Do not import Clue/Cluedo characters, board design, or another game's rules.
- Preserve native semantic controls, reviewable text, explicit user-paced actions, predictable focus, and guided learning through real game actions. Essential information must not depend on sight or audio. Keep tutorial assistance separate from ordinary play; the human notebook must not silently solve the case.
- Preserve completed implementation, inherited tests, provenance, and accepted behavior. Diagnose failures at the affected boundary and repair forward rather than rebuilding valid work to fix a delivery or verification problem.

## Verify the actual task

- Use the checked-out branch's README and package scripts. Browser build/tests are not available in the headless checkpoint. For code changes, run applicable checks against the final source and cover affected interruptions, privacy, legal choices, recovery, and complete player flows.
- For documentation-only changes, check links, source identities, status claims, whitespace, and the exact changed-file boundary. Report any runtime checks not rerun; never present inherited results as new results.
- Keep implemented, committed, remotely verified, published, and user-accepted states separate. Automated engine/browser checks do not establish actual iPhone VoiceOver usability or user approval.

## Leave one clear handoff

- Update the existing document that owns a changed fact or reusable lesson, and link to it from this map when needed. Preserve dated checkpoint history; correct stale current summaries without duplicating a rolling history across files.
- Record the exact source, changed files, checks passed/failed/not run, pending acceptance gate, protected or paused work, and next bounded step. Confirm branch/head and relevant PR state again before claiming completion.
- This is a public repository. Keep personal details, credentials, private artifacts, and unrelated incidents out of reusable guidance.
- Before any authorized push or PR, inspect automation triggers even for docs-only changes. Repository access and a local patch do not authorize publication, PR-state changes, merge, or deployment. Reuse the documented existing hosting target only when deployment is separately authorized.
