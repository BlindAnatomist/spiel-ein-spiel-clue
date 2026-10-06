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

Narrative checkpoint: docs/WORLD_AND_CAST.md now preserves the accepted Vaudrey House direction, Calder Works history, sealed deposition, six suspects, six stratagems, nine locations, fixed historical guilt versus generated procedural guilt, and the current suspect relationship architecture. Use that file rather than chat history when continuing world or character design.

Two tracks can now proceed in parallel:
- Real iPhone VoiceOver acceptance of the existing guided checkpoint, using docs/IPHONE_ACCEPTANCE.md.
- Narrative/content development from docs/WORLD_AND_CAST.md.

Do not let full-game narrative expansion destabilize the small teaching fixture before actual iPhone acceptance. The planned full game is a separate Vaudrey House content pack; the existing 3 x 3 x 3 tutorial remains intentionally small unless testing demonstrates a reason to change it.

If interrupted during final handoff, check the branch head, PR CI and this same Site's latest deployment. Do not repeat completed tests unless their inputs changed. Documentation-only changes do not change the tested app bundle.
