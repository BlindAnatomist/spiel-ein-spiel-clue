import { categories, type Action, type Decision, type Hypothesis, type PlayerView } from './types.ts';
import { hypotheses, sameHypothesis } from './util.ts';

function nextHop(view: PlayerView, target: string): string | undefined {
  const start = view.investigators.find(p => p.id === view.player)!.location;
  const queue = [{ at: start, path: [] as string[] }];
  const seen = new Set([start]);
  for (const item of queue) {
    if (item.at === target) return item.path[0];
    for (const edge of view.content.routes) if (edge.from === item.at && !seen.has(edge.to)) {
      seen.add(edge.to); queue.push({ at: edge.to, path: [...item.path, edge.to] });
    }
  }
  return undefined;
}

/** No host imports, shared mutable state, hidden seed, or external inference service. */
export function baselineBot(view: PlayerView): Decision {
  const legal = view.legalActions;
  if (!legal.length) throw new Error('Policy called without legal actions');
  const phase = view.phase;
  if (phase.kind === 'refutation') {
    const reveals = legal.filter((a): a is Extract<Action, { type: 'reveal' }> => a.type === 'reveal');
    if (!reveals.length) return { action: { type: 'pass' }, reasoning: { code: 'noMatchingEvidence', facts: { suggestionId: phase.suggestionId } } };
    const repeated = reveals.find(a => view.events.some(e => e.data.type === 'evidenceRevealed' && e.data.player === view.player && e.data.recipient === phase.player && e.data.card === a.card));
    const selected = repeated ?? reveals[0]!;
    return { action: selected, reasoning: { code: repeated ? 'repeatKnownEvidence' : 'firstLegalEvidence', facts: { card: selected.card, suggestionId: phase.suggestionId } } };
  }

  const knownSolution: Partial<Hypothesis> = {};
  // If every other player passed, each card not in my hand must be in the solution.
  // This inference stays inside this bot policy; it does not alter the human notebook.
  for (const event of view.events) {
    const data = event.data;
    if (data.type === 'suggestionClosed' && data.player === view.player && data.refuter === null) {
      for (const c of categories) if (!view.hand.includes(data.hypothesis[c])) knownSolution[c] = data.hypothesis[c];
    }
  }
  const eliminated = new Set(view.notebook.entries.filter(e => e.eliminatedFromSolution).map(e => e.card));
  for (const c of categories) {
    const remaining = view.content.cards[c].filter(card => !eliminated.has(card));
    if (remaining.length === 1) knownSolution[c] = remaining[0]!;
  }
  let candidates = hypotheses(view.content).filter(h => categories.every(c => !eliminated.has(h[c]) && (!knownSolution[c] || knownSolution[c] === h[c])));
  // A publicly refuted triple cannot be the hidden triple. A failed accusation excludes only that triple.
  candidates = candidates.filter(h => !view.events.some(e => (e.data.type === 'refuted' || (e.data.type === 'accused' && !e.data.correct)) && sameHypothesis(h, e.data.hypothesis)));
  if (!candidates.length) throw new Error('Inconsistent permitted knowledge');
  if (candidates.length === 1) return { action: { type: 'accuse', hypothesis: candidates[0]! }, reasoning: { code: 'resolvedSolution', facts: { candidate: candidates[0]!, candidateCount: 1, knownSolution } } };
  if (phase.kind !== 'turn') throw new Error('Unexpected phase');
  if (phase.suggested) return { action: { type: 'endTurn' }, reasoning: { code: 'finishTurn', facts: {} } };
  // Stable enumeration exhausts remaining candidates. Previous refutations eliminate tested triples.
  const candidate = candidates[0]!;
  const location = view.investigators.find(p => p.id === view.player)!.location;
  if (location === candidate.location) return { action: { type: 'suggest', hypothesis: candidate }, reasoning: { code: 'testCandidate', facts: { candidate, candidateCount: candidates.length } } };
  const destination = nextHop(view, candidate.location);
  const move = legal.find(a => a.type === 'move' && a.destination === destination);
  if (move && destination) return { action: move, reasoning: { code: 'travelToCandidate', facts: { candidate, candidateCount: candidates.length, destination } } };
  return { action: { type: 'endTurn' }, reasoning: { code: 'finishTurn', facts: {} } };
}
