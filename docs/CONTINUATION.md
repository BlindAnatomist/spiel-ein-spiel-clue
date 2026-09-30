# Continuation: checkpoint 2

Branch: feat/guided-browser-checkpoint. Base: fd15c90 on main. No open pull requests at inspection.

Existing 19 engine contracts passed before edits. Engine rules are preserved.

In progress: guided real-engine practice, ordinary human play, stepped restricted observation, local host-owned resume, semantic browser UI, automated interaction tests, isolated Sites preview.

Architecture: plain TypeScript browser adapter; private host owns Referee and archives. Presentation receives restricted snapshots only. Tutorial is a separate scripted sequence of legal actions; all progress is explicit, no timers.

Do not recreate checkpoint 1. Resume from this branch and inspect working changes and test results. No deployment exists yet.

Implementation completed locally: app/content.ts, tutorial.ts (real-engine fixed practice), host.ts (restricted screens, versioned journal+archive validation), main.ts (semantic manual UI), narration.ts; static esbuild build passes. New host tests and Playwright browser tests are written. Browser installation initially failed with truncated download; trying a pinned Playwright browser distribution. Do not recreate these files. Site registered once: project_id in .openai/hosting.json; not yet deployed. Credentials remain only in tool session memory.
