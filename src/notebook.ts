import { categories, type Content, type Notebook, type PlayerId, type VisibleEvent } from './types.ts';

/** Pure projection: consumes only the events this player is allowed to receive. */
export function buildNotebook(content: Content, player: PlayerId, events: readonly VisibleEvent[]): Notebook {
  const notebook: Notebook = {
    player,
    entries: categories.flatMap(category => content.cards[category].map(card => ({ card, category, status: 'unresolved' as const, eliminatedFromSolution: false, reveals: [] }))),
    publicFacts: [],
  };
  for (const event of events) {
    const data = event.data;
    if (data.type === 'handDealt' && data.player === player) for (const card of data.cards) {
      const entry = notebook.entries.find(e => e.card === card)!;
      entry.status = 'personallyHeld'; entry.eliminatedFromSolution = true;
    }
    if (data.type === 'evidenceRevealed' && data.recipient === player) {
      const entry = notebook.entries.find(e => e.card === data.card)!;
      entry.status = 'directlyRevealed'; entry.eliminatedFromSolution = true;
      entry.reveals.push({ by: data.player, eventId: event.id });
    }
    if (data.type === 'passed' || data.type === 'refuted') notebook.publicFacts.push({
      kind: data.type === 'passed' ? 'cannotHold' : 'holdsAtLeastOne',
      player: data.player, cards: categories.map(c => data.hypothesis[c]), eventId: event.id,
    });
    if (data.type === 'accused' && !data.correct) notebook.publicFacts.push({ kind: 'failedAccusation', hypothesis: data.hypothesis, eventId: event.id });
  }
  return notebook;
}
