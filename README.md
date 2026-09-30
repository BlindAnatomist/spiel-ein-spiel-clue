# Original deduction game: headless checkpoint 1

This repository is the authoritative project record. The first checkpoint implements an original-world-ready, presentation-independent deduction engine. All current content IDs are abstract placeholders. There is no playable browser interface yet.

## Run

Requires Node.js 24 or later and npm. No runtime dependencies, API keys, or services.

```sh
npm ci
npm run check
npm run simulate -- checkpoint-1
```

`check` runs strict TypeScript checking and the deterministic contract tests. `simulate` accepts an optional seed, runs baseline bots, and prints a public outcome summary. With `checkpoint-1`, the expected result is investigator-b winning after 62 actions and 16 turns. A simulation action limit is reported explicitly, never represented as a completed game.

## Read next

- [Foundation and contracts](docs/FOUNDATION.md)
- [Checkpoint record and next work](docs/CHECKPOINT_1.md)
- `src/types.ts`: structured actions, events, views, notebook, policy contract
- `src/referee.ts`: trusted rules authority and deterministic replay
- `src/bot.ts`: independent baseline policy
- `test/contracts.test.ts`: executable contracts

## Minimal host integration

```ts
import { Referee } from './src/referee.ts';
import { exampleContent } from './src/content.ts';

// Trusted host only. Never deliver the seed, referee, or archive to a player.
const referee = new Referee(exampleContent, 'private-host-seed');
const investigator = referee.playerPort('investigator-a');
const view = investigator.view();
// A presentation adapter renders structured choices from view.legalActions.
// investigator.act(chosenAction) rejects anything currently illegal.
```

The player-facing root entry point exports types, the notebook projection, and baseline policy. Referee and simulation are separate host entry points. This is an architectural boundary, not a sandbox for executing hostile JavaScript. A later browser host must preserve the boundary when transporting views.
