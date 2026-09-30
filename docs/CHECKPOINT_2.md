# Checkpoint 2: guided first game and browser play

Branch: `feat/guided-browser-checkpoint`. Base engine: `fd15c90`. See CONTINUATION.md for delivery status; this record is finalized after deployment and remote CI verification.

## Implemented

The same real TypeScript referee now drives three entry points: Learn to play, Play a game, and Listen to bots play. No engine rules were changed. Presentation uses provisional labels for three investigators, three suspects, three methods and three locations. Investigator identities are separate from suspect cards.

Practice uses a fixed seed and a separately authored sequence of legal actions. The learner reviews their actual cards, moves along a graph connection, builds/reviews/submits a suggestion, receives private evidence, retrieves its provenance from the notebook, chooses between two legal reveals, makes a forced pass, tests unknown locations using two held cards, reasons correctly from all-pass, isolates the remaining suspect and method, and confirms a winning accusation. The route accepts either multiple-card reveal. Other human choices are constrained with an explicit message before submission, preventing an unreachable later lesson. It never resets silently. The failed-accusation rule is explained without requiring a deliberately lost practice game.

Ordinary play uses a fresh random seed and only the existing baseline bot. There are no tutorial scripts or deduction hints in that mode. Suggestions use current location; accusations permit every location and require explicit review and confirmation. An eliminated human continues responding to bots. Step controls stop for every human decision.

Observation is live, one legal action at a time. Public observation uses only public ledger events; follow-investigator adds that investigator's permitted evidence and notebook. Perspective is selected at the menu and preserved on resume. There is no precomputed final state, future evidence, omniscient display, or public bot reasoning.

## Components and boundary

- `app/content.ts`: provisional labels and small content configuration outside the engine.
- `app/tutorial.ts`: private-host practice fixture and lessons, independent of ordinary bot policy.
- `app/host.ts`: referee ownership, restricted Screen projection, revision-checked actions, and validated local resume. Only the current lesson is projected. Scripted bot actions are not exposed in lesson metadata.
- `app/narration.ts`: text from already-filtered events, including speaker names.
- `app/main.ts`: semantic presentation and interaction; receives no archive, seed, full hand distribution, debug ledger, or future tutorial lessons.
- `scripts/build.mjs`: static browser bundle; no backend, external speech, LLM or audio integration.

Local saves contain privileged archives, but only the host reads/writes them. This is application-level isolation, not protection against inspecting one's own browser. The bundle and local storage can be inspected by a technically equipped owner; no adversarial secrecy is claimed.

## Pacing and focus

Everything advances through an explicit user action. There are no game timers, autoplay, speech-duration guesses, live-region completion triggers, or background bot loops.

Stable document sections hold the objective, latest exchange, next action and review navigation. Only the action area and exchange text are updated on an accepted transition. Practice focuses the new objective heading; ordinary evidence updates focus the latest exchange; mandatory human responses focus the action heading; completion focuses the outcome heading. Explanations and repeat focus existing text without creating a rules event. No live region duplicates forced-focus announcements.

Native modal dialogs receive focus at their heading and support Escape. Closing review returns to its invoking control. Composer selectors retain values through review/change-choices; cancel returns to the invoking action. Submitting closes the dialog and focuses the next game state. Current tutorial objective remains available in every review panel. Notebook uses one category selector, named item buttons and concise provenance, rather than a spoken matrix.

## Recovery

Practice, ordinary play and observation each have a separate device-local save. Opening a mode with a save offers Resume or explicitly confirmed replacement. Saves are versioned and size/action bounded. Restore replays the command journal through the host and real engine, then compares the resulting archive; it never trusts a stored lesson index or mutable snapshot. Wrong version, damaged JSON, illegal actions or inconsistent archive produce a readable error without replacing the save. Unavailable storage leaves a playable session with an explicit warning. Revision checks reject stale duplicate actions.

Review and unfinished form selection are temporary UI states, not saved game actions. After reload the confirmed game/lesson position is restored; an open form or review panel is reopened by the player.

## Verification commands

```sh
npm ci
npm run check
npm run build
npx playwright install --with-deps chromium webkit
npm run test:browser
npm run simulate -- checkpoint-1
```

Tests cover the existing engine, both practice reveal paths, all lesson restore positions, normal play, human refutation interrupts, failure duty, observation privacy at current position, save corruption, duplicate actions, semantic controls, accessible names, keyboard operation, focus return, canceled accusations, history and repeat invariance, and mobile text enlargement. Browser tests execute the production build.

Automation does not establish real iPhone VoiceOver usability. No user approval or real-device testing is claimed. See IPHONE_ACCEPTANCE.md.

## Limitations and next checkpoint

Names and fiction are provisional. The practice follows a prescribed teaching route; ordinary play is unrestricted within the engine rules. There are no player-entered notebook conclusions, automatic human solving, timed playback, audio generation, accounts or multiplayer services. This is a small local game with local-only resume; progress does not sync across devices. Renderer review is deliberately based on direct evidence plus public history, without automatic constraint solving.

The next checkpoint should respond to actual iPhone VoiceOver feedback: focus announcements, verbosity, movement between action and notebook, response interruptions, and manual pacing. Refine those based on use before expanding fiction, bots, or presentation layers.
