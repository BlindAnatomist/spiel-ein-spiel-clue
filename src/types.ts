/** Domain identifiers are content IDs, never fictional names or presentation text. */
export const categories = ['suspect', 'method', 'location'] as const;
export type Category = typeof categories[number];
export type CardId = string;
export type PlayerId = string;
export type Hypothesis = Record<Category, CardId>;
export interface Content {
  cards: Record<Category, CardId[]>;
  /** Directed edges; declare both directions for a two-way route. */
  routes: { from: CardId; to: CardId }[];
  players: PlayerId[];
}
export type Action =
  | { type: 'move'; destination: CardId }
  | { type: 'suggest'; hypothesis: Hypothesis }
  | { type: 'reveal'; card: CardId }
  | { type: 'pass' }
  | { type: 'endTurn' }
  | { type: 'accuse'; hypothesis: Hypothesis };
export type PublicPhase =
  | { kind: 'turn'; player: PlayerId; moved: boolean; suggested: boolean }
  | { kind: 'refutation'; player: PlayerId; responder: PlayerId; suggestionId: number; hypothesis: Hypothesis }
  | { kind: 'finished'; winner: PlayerId | null };
export interface Investigator {
  id: PlayerId;
  location: CardId;
  handCount: number;
  eliminated: boolean;
}
export type PublicFact =
  | { kind: 'cannotHold'; player: PlayerId; cards: CardId[]; eventId: number }
  | { kind: 'holdsAtLeastOne'; player: PlayerId; cards: CardId[]; eventId: number }
  | { kind: 'failedAccusation'; hypothesis: Hypothesis; eventId: number };
export interface NotebookEntry {
  card: CardId;
  category: Category;
  status: 'personallyHeld' | 'directlyRevealed' | 'unresolved';
  /** Only direct evidence eliminates a card from the human notebook. */
  eliminatedFromSolution: boolean;
  reveals: { by: PlayerId; eventId: number }[];
}
export interface Notebook {
  player: PlayerId;
  entries: NotebookEntry[];
  publicFacts: PublicFact[];
}
export type PublicEvent =
  | { type: 'gameStarted'; content: Content; investigators: Investigator[]; order: PlayerId[] }
  | { type: 'turnStarted'; player: PlayerId; turn: number }
  | { type: 'moved'; player: PlayerId; from: CardId; to: CardId }
  | { type: 'suggested'; player: PlayerId; hypothesis: Hypothesis; suggestionId: number }
  | { type: 'passed'; player: PlayerId; hypothesis: Hypothesis; suggestionId: number }
  | { type: 'refuted'; player: PlayerId; recipient: PlayerId; hypothesis: Hypothesis; suggestionId: number }
  | { type: 'suggestionClosed'; player: PlayerId; hypothesis: Hypothesis; suggestionId: number; refuter: PlayerId | null }
  | { type: 'turnEnded'; player: PlayerId }
  | { type: 'accused'; player: PlayerId; hypothesis: Hypothesis; correct: boolean }
  | { type: 'gameEnded'; winner: PlayerId | null };
export type PrivateEvent =
  | { type: 'handDealt'; player: PlayerId; cards: CardId[] }
  | { type: 'evidenceRevealed'; player: PlayerId; recipient: PlayerId; card: CardId; suggestionId: number };
export interface Reasoning {
  code: 'resolvedSolution' | 'testCandidate' | 'travelToCandidate' | 'repeatKnownEvidence' | 'firstLegalEvidence' | 'noMatchingEvidence' | 'finishTurn';
  /** Structured inputs actually used by the policy, never retrospective prose. */
  facts: { candidate?: Hypothesis; knownSolution?: Partial<Hypothesis>; candidateCount?: number; destination?: CardId; card?: CardId; suggestionId?: number };
}
export interface Decision { action: Action; reasoning: Reasoning }
export type DebugEvent =
  | { type: 'setup'; rulesVersion: string; seed: string; content: Content; solution: Hypothesis; hands: Record<PlayerId, CardId[]> }
  | { type: 'command'; player: PlayerId; action: Action }
  | { type: 'botDecision'; player: PlayerId; decision: Decision; notebook: Notebook };
export type VisibleEvent =
  | { id: number; visibility: 'public'; data: PublicEvent }
  | { id: number; visibility: 'private'; recipients: PlayerId[]; data: PrivateEvent };
export type LedgerEvent = VisibleEvent | { id: number; visibility: 'referee'; data: DebugEvent };
export interface PlayerView {
  rulesVersion: string;
  player: PlayerId;
  content: Content;
  order: PlayerId[];
  investigators: Investigator[];
  phase: PublicPhase;
  turn: number;
  hand: CardId[];
  notebook: Notebook;
  events: VisibleEvent[];
  legalActions: Action[];
}
/** Bind one port per authenticated actor at the host boundary. No actor selection. */
export interface PlayerPort {
  view(): PlayerView;
  act(action: Action): void;
}
export type BotPolicy = (view: PlayerView) => Decision;
