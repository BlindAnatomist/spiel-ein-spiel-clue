import { simulate } from './simulation.ts';
import { exampleContent } from './content.ts';
const seed = process.argv[2] ?? 'checkpoint-1';
const result = simulate(exampleContent, seed);
// Default output is public. Seed/archive export is a trusted host concern.
console.log(JSON.stringify({ actions: result.actions, turns: result.turns, outcome: result.outcome }, null, 2));
if (result.outcome.kind === 'actionLimit') process.exitCode = 1;
