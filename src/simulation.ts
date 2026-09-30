import type { BotPolicy, Content } from './types.ts';
import { Referee } from './referee.ts';
import { baselineBot } from './bot.ts';

/** Trusted orchestration; policy receives only its own permitted view via stepBot. */
export function simulate(content: Content, seed: string, options: { maxActions?: number; policy?: BotPolicy } = {}) {
  const maxActions = options.maxActions ?? 10000;
  if (!Number.isSafeInteger(maxActions) || maxActions < 1) throw new Error('Invalid action limit');
  const referee = new Referee(content, seed);
  let actions = 0;
  while (actions < maxActions && referee.stepBot(options.policy ?? baselineBot) !== null) actions++;
  const state = referee.debugSnapshot();
  return { referee, actions, turns: state.turn, outcome: state.phase.kind === 'finished' ? state.phase : { kind: 'actionLimit' as const } };
}
