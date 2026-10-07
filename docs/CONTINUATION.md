# Continuation: checkpoint 2 delivered

Authoritative repository: BlindAnatomist/spiel-ein-spiel-clue.
Branch: feat/guided-browser-checkpoint.
Implementation commit: 6dda8834b083260d0c091001d4c8a6dec6019ede.
Pull request: https://github.com/BlindAnatomist/spiel-ein-spiel-clue/pull/1.
Main is unchanged; checkpoint 2 is on the review branch. The delivery-record follow-up changes documentation only.

Implemented: complete interactive real-engine practice, ordinary play, public/followed stepped observation, semantic manual UI, notebook/history review, explicit focus and confirmation, validated local resume. Engine rules unchanged. Do not rebuild checkpoint 1 or repeat this implementation.

Verified: 27 engine/host tests; strict TypeScript; production build; original reference simulation; 9 local Chromium browser tests; all 18 Chromium/WebKit tests in remote CI. Remote run 36654663858 completed successfully on 6dda883. Actual iPhone VoiceOver testing is still pending.

Published preview: https://deduction-practice.blind-anatomist.chatgpt.site
Site identity: reuse .openai/hosting.json; never create a replacement Site.
Initial deployment appgdep_6abc6446dd348191814464cdee7bbd3f succeeded; source 6dda883. Site remains owner-private. GitHub remains authoritative; Sites stores a publishing mirror. Publishing credentials are short-lived: renew for this same Site if necessary, never store them in files.

Narrative checkpoint: docs/WORLD_AND_CAST.md preserves the Vaudrey House direction, Calder Works history, sealed deposition, six suspects, six stratagems, nine locations, fixed historical guilt versus generated procedural guilt, and the working suspect relationship architecture. Use the repository rather than chat history when continuing world or character design.

Narrative logic audit, 2026-10-06: read docs/NARRATIVE_LOGIC_AUDIT.md before treating the detailed world draft as implementation-ready. The review retains the premise but identifies continuity conflicts, missing deposition chronology/custody, overlapping stratagems, unverified causal/legal connections, unsupported knowledge sources, forced moral symmetry, and host/content/save integration requirements. Findings and recommended repairs are distinguished; proposed replacements are not automatically approved canon. The original WORLD_AND_CAST.md is preserved as the reviewed version.

The corrected narrative order is case contract, history/document timeline, character knowledge ledger, relationship revision, supported-combination validation, then speaking architecture and larger asset production. In particular, do not proceed directly from the earlier world draft to bulk dialogue generation. Do not replace the shared app/content.ts with the full pack without first separating practice/play content and save compatibility.

This audit changed documentation only. It did not change application rules, content, saves or deployment; it did not rerun application tests or establish real iPhone acceptance. The location graph was checked separately: nine rooms, ten bidirectional connections, connected, maximum shortest path four moves. Play balance and all 324 full-game narrative combinations remain unvalidated.

Two tracks can proceed in parallel:
- Real iPhone VoiceOver acceptance of the existing guided checkpoint, using docs/IPHONE_ACCEPTANCE.md.
- Narrative repair from docs/NARRATIVE_LOGIC_AUDIT.md alongside docs/WORLD_AND_CAST.md.

Do not let full-game narrative expansion destabilize the small teaching fixture before actual iPhone acceptance. The planned full game is a separate Vaudrey House content pack; the existing 3 x 3 x 3 tutorial remains intentionally small unless testing demonstrates a reason to change it.

If interrupted during final handoff, check the branch head, PR CI and this same Site's latest deployment. Do not repeat completed tests unless their inputs changed. Documentation-only changes do not change the tested app bundle.
