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

Current next step: user opens Learn to play on iPhone and follows the practice. Use docs/IPHONE_ACCEPTANCE.md to report actual VoiceOver behavior. Focus, pacing and instructional clarity should be refined from that feedback before larger game content or audio work.

If interrupted during final handoff, check the branch head, PR CI and this same Site's latest deployment. Do not repeat completed tests unless their inputs changed. Documentation-only changes do not change the tested app bundle.
