import { categories, type Action, type BotPolicy, type Content, type DebugEvent, type Decision, type Hypothesis, type Investigator, type LedgerEvent, type PlayerId, type PlayerPort, type PlayerView, type PrivateEvent, type PublicEvent, type PublicPhase, type Reasoning, type VisibleEvent } from './types.ts';
import { allCards, frozenCopy, hypotheses, sameHypothesis, seededRandom, shuffle, validateContent } from './util.ts';
import { buildNotebook } from './notebook.ts';

export const RULES_VERSION = 'headless-1';
export interface RecordedStep { player: PlayerId; action: Action; reasoning?: Reasoning }
/** Referee-only: seed and commands can reconstruct secrets. Never send to a player. */
export interface ReplayArchive { rulesVersion: string; content: Content; seed: string; steps: RecordedStep[] }

function normalizeAction(input: unknown): Action {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid action');
  const a = input as Record<string, unknown>;
  const exact = (object: object, keys: string[]) => Object.keys(object).sort().join(',') === keys.sort().join(',');
  if (a.type === 'pass' || a.type === 'endTurn') {
    if (exact(a, ['type'])) return { type: a.type };
  }
  if (a.type === 'move' && typeof a.destination === 'string' && exact(a, ['type', 'destination'])) return { type: 'move', destination: a.destination };
  if (a.type === 'reveal' && typeof a.card === 'string' && exact(a, ['type', 'card'])) return { type: 'reveal', card: a.card };
  if ((a.type === 'suggest' || a.type === 'accuse') && exact(a, ['type', 'hypothesis']) && a.hypothesis && typeof a.hypothesis === 'object' && exact(a.hypothesis, [...categories])) {
    const h = a.hypothesis as Record<string, unknown>;
    if (categories.every(c => typeof h[c] === 'string')) return { type: a.type, hypothesis: { suspect: h.suspect as string, method: h.method as string, location: h.location as string } };
  }
  throw new Error('Invalid action');
}

/** Trusted host capability. Give policies/clients only playerPort(), never this object. */
export class Referee {
  #content: Content;
  #seed: string;
  #solution: Hypothesis;
  #hands: Record<PlayerId, string[]>;
  #order: PlayerId[];
  #investigators: Investigator[];
  #phase: PublicPhase;
  #turn = 1;
  #suggestions = 0;
  #ledger: LedgerEvent[] = [];
  #steps: RecordedStep[] = [];

  constructor(content: Content, seed: string) {
    validateContent(content);
    if (typeof seed !== 'string' || seed.length === 0) throw new Error('Require a nonempty string seed');
    // Explicit schema projection: extra host fields cannot hitchhike into public content.
    this.#content = structuredClone({ cards: Object.fromEntries(categories.map(c => [c, content.cards[c]])) as Content['cards'], routes: content.routes.map(r => ({ from: r.from, to: r.to })), players: content.players });
    this.#seed = seed;
    const random = seededRandom(seed);
    this.#solution = Object.fromEntries(categories.map(c => [c, this.#content.cards[c][Math.floor(random() * this.#content.cards[c].length)]!])) as Hypothesis;
    this.#order = shuffle(this.#content.players, random);
    this.#hands = Object.fromEntries(this.#order.map(id => [id, []]));
    const deck = shuffle(allCards(this.#content).filter(card => !Object.values(this.#solution).includes(card)), random);
    deck.forEach((card, i) => this.#hands[this.#order[i % this.#order.length]!]!.push(card));
    this.#investigators = this.#order.map(id => ({ id, location: this.#content.cards.location[Math.floor(random() * this.#content.cards.location.length)]!, handCount: this.#hands[id]!.length, eliminated: false }));
    this.#phase = { kind: 'turn', player: this.#order[0]!, moved: false, suggested: false };
    this.#debug({ type: 'setup', rulesVersion: RULES_VERSION, seed, content: this.#content, solution: this.#solution, hands: this.#hands });
    this.#public({ type: 'gameStarted', content: this.#content, investigators: this.#investigators, order: this.#order });
    for (const player of this.#order) this.#private([player], { type: 'handDealt', player, cards: this.#hands[player]! });
    this.#public({ type: 'turnStarted', player: this.#phase.player, turn: this.#turn });
  }

  #public(data: PublicEvent): void { this.#ledger.push(structuredClone({ id: this.#ledger.length, visibility: 'public', data })); }
  #private(recipients: PlayerId[], data: PrivateEvent): void { this.#ledger.push(structuredClone({ id: this.#ledger.length, visibility: 'private', recipients, data })); }
  #debug(data: DebugEvent): void { this.#ledger.push(structuredClone({ id: this.#ledger.length, visibility: 'referee', data })); }
  #assertPlayer(player: PlayerId): void { if (!this.#order.includes(player)) throw new Error('Unknown player'); }

  /** Public mystery projection. No seed, hands, private reveals, or policy reasoning. */
  publicLedger(throughId = Infinity): VisibleEvent[] {
    return frozenCopy(this.#ledger.filter((e): e is VisibleEvent => e.id <= throughId && e.visibility === 'public'));
  }
  /** Trusted host selects identity. Production adapters must authenticate this selection. */
  followLedger(player: PlayerId, throughId = Infinity): VisibleEvent[] {
    this.#assertPlayer(player);
    return frozenCopy(this.#ledger.filter((e): e is VisibleEvent => e.id <= throughId && (e.visibility === 'public' || (e.visibility === 'private' && e.recipients.includes(player)))));
  }
  debugLedger(): LedgerEvent[] { return frozenCopy(this.#ledger); }
  debugSnapshot() {
    return frozenCopy({ solution: this.#solution, hands: this.#hands, phase: this.#phase, investigators: this.#investigators, turn: this.#turn });
  }
  archive(): ReplayArchive { return frozenCopy({ rulesVersion: RULES_VERSION, content: this.#content, seed: this.#seed, steps: this.#steps }); }

  view(player: PlayerId): PlayerView {
    this.#assertPlayer(player);
    const events = this.followLedger(player);
    // Allowlist only; neither spread internal state nor attach callable host references.
    return frozenCopy({ rulesVersion: RULES_VERSION, player, content: this.#content, order: this.#order,
      investigators: this.#investigators, phase: this.#phase, turn: this.#turn,
      hand: this.#hands[player]!, notebook: buildNotebook(this.#content, player, events),
      events, legalActions: this.#legalActions(player) });
  }
  playerPort(player: PlayerId): PlayerPort {
    this.#assertPlayer(player);
    return Object.freeze({ view: () => this.view(player), act: (action: Action) => this.submit(player, action) });
  }
  #legalActions(player: PlayerId): Action[] {
    const phase = this.#phase;
    if (phase.kind === 'finished') return [];
    if (phase.kind === 'refutation') {
      if (phase.responder !== player) return [];
      const cards = this.#hands[player]!.filter(card => Object.values(phase.hypothesis).includes(card));
      return cards.length ? cards.map(card => ({ type: 'reveal', card })) : [{ type: 'pass' }];
    }
    if (phase.player !== player) return [];
    const location = this.#investigators.find(p => p.id === player)!.location;
    const actions: Action[] = [{ type: 'endTurn' }];
    if (!phase.moved && !phase.suggested) for (const edge of this.#content.routes) if (edge.from === location) actions.push({ type: 'move', destination: edge.to });
    if (!phase.suggested) for (const h of hypotheses(this.#content)) if (h.location === location) actions.push({ type: 'suggest', hypothesis: h });
    for (const h of hypotheses(this.#content)) actions.push({ type: 'accuse', hypothesis: h });
    return actions;
  }

  /** Host entry point. Invalid actions are rejected atomically before any event is emitted. */
  submit(player: PlayerId, input: Action, reasoning?: Reasoning): void {
    this.#assertPlayer(player);
    const action = normalizeAction(input);
    if (!this.#legalActions(player).some(a => JSON.stringify(a) === JSON.stringify(action))) throw new Error('Illegal action');
    // Clone metadata before mutation; bots cannot inject non-cloneable values mid-transition.
    const step = structuredClone({ player, action, ...(reasoning ? { reasoning } : {}) });
    if (step.reasoning) this.#debug({ type: 'botDecision', player, decision: { action, reasoning: step.reasoning }, notebook: this.view(player).notebook });
    this.#debug({ type: 'command', player, action });
    this.#steps.push(step);
    const phase = this.#phase;
    switch (action.type) {
      case 'move': {
        if (phase.kind !== 'turn') throw new Error('Internal phase invariant');
        const investigator = this.#investigators.find(p => p.id === player)!;
        this.#public({ type: 'moved', player, from: investigator.location, to: action.destination });
        investigator.location = action.destination; phase.moved = true; break;
      }
      case 'suggest': {
        const suggestionId = ++this.#suggestions;
        this.#public({ type: 'suggested', player, hypothesis: action.hypothesis, suggestionId });
        const responder = this.#order[(this.#order.indexOf(player) + 1) % this.#order.length]!;
        this.#phase = { kind: 'refutation', player, responder, hypothesis: action.hypothesis, suggestionId }; break;
      }
      case 'pass': {
        if (phase.kind !== 'refutation') throw new Error('Internal phase invariant');
        this.#public({ type: 'passed', player, hypothesis: phase.hypothesis, suggestionId: phase.suggestionId });
        const next = this.#order[(this.#order.indexOf(player) + 1) % this.#order.length]!;
        if (next === phase.player) this.#closeSuggestion(null);
        else phase.responder = next;
        break;
      }
      case 'reveal': {
        if (phase.kind !== 'refutation') throw new Error('Internal phase invariant');
        this.#public({ type: 'refuted', player, recipient: phase.player, hypothesis: phase.hypothesis, suggestionId: phase.suggestionId });
        this.#private([player, phase.player], { type: 'evidenceRevealed', player, recipient: phase.player, card: action.card, suggestionId: phase.suggestionId });
        this.#closeSuggestion(player); break;
      }
      case 'endTurn': this.#nextTurn(player); break;
      case 'accuse': {
        const correct = sameHypothesis(action.hypothesis, this.#solution);
        this.#public({ type: 'accused', player, hypothesis: action.hypothesis, correct });
        if (correct) this.#finish(player);
        else {
          this.#investigators.find(p => p.id === player)!.eliminated = true;
          this.#nextTurn(player);
        }
        break;
      }
    }
  }
  #closeSuggestion(refuter: PlayerId | null): void {
    const phase = this.#phase;
    if (phase.kind !== 'refutation') throw new Error('Internal phase invariant');
    this.#public({ type: 'suggestionClosed', player: phase.player, hypothesis: phase.hypothesis, suggestionId: phase.suggestionId, refuter });
    this.#phase = { kind: 'turn', player: phase.player, moved: true, suggested: true };
  }
  #nextTurn(player: PlayerId): void {
    this.#public({ type: 'turnEnded', player });
    for (let offset = 1; offset <= this.#order.length; offset++) {
      const next = this.#order[(this.#order.indexOf(player) + offset) % this.#order.length]!;
      if (!this.#investigators.find(p => p.id === next)!.eliminated) {
        this.#phase = { kind: 'turn', player: next, moved: false, suggested: false };
        this.#turn++;
        this.#public({ type: 'turnStarted', player: next, turn: this.#turn }); return;
      }
    }
    this.#finish(null);
  }
  #finish(winner: PlayerId | null): void {
    this.#phase = { kind: 'finished', winner };
    this.#public({ type: 'gameEnded', winner });
  }
  /** Policy invocation contains precisely one frozen, serializable PlayerView argument. */
  stepBot(policy: BotPolicy): Decision | null {
    const phase = this.#phase;
    if (phase.kind === 'finished') return null;
    const player = phase.kind === 'refutation' ? phase.responder : phase.player;
    const decision = policy(this.view(player));
    this.submit(player, decision.action, decision.reasoning);
    return frozenCopy(decision);
  }
}

export function replay(archive: ReplayArchive): Referee {
  if (archive.rulesVersion !== RULES_VERSION) throw new Error('Unsupported replay rules version');
  const referee = new Referee(archive.content, archive.seed);
  for (const step of archive.steps) referee.submit(step.player, step.action, step.reasoning);
  return referee;
}
