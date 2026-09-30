import { categories, type Content, type Hypothesis } from './types.ts';

export function frozenCopy<T>(input: T): T {
  const copy = structuredClone(input);
  function freeze(value: unknown): void {
    if (value !== null && typeof value === 'object') {
      Object.values(value).forEach(freeze);
      Object.freeze(value);
    }
  }
  freeze(copy);
  return copy;
}

/** FNV-1a string seed + Mulberry32. Fixed algorithm, no time/random dependencies. */
export function seededRandom(seed: string): () => number {
  let state = 2166136261;
  for (let i = 0; i < seed.length; i++) state = Math.imul(state ^ seed.charCodeAt(i), 16777619) >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let x = Math.imul(state ^ (state >>> 15), 1 | state);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
export function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}
export function allCards(content: Content): string[] { return categories.flatMap(c => content.cards[c]); }
export function hypotheses(content: Content): Hypothesis[] {
  return content.cards.suspect.flatMap(suspect => content.cards.method.flatMap(method =>
    content.cards.location.map(location => ({ suspect, method, location }))));
}
export function sameHypothesis(a: Hypothesis, b: Hypothesis): boolean {
  return categories.every(c => a[c] === b[c]);
}
export function validateContent(content: Content): void {
  const validIds = (ids: string[]) => Array.isArray(ids) && ids.every(id => typeof id === 'string' && /^[a-z][a-z0-9-]*$/.test(id)) && new Set(ids).size === ids.length;
  if (!content || !content.cards || !categories.every(c => validIds(content.cards[c]) && content.cards[c].length >= 2 && content.cards[c].length <= 12)) throw new Error('Each category requires 2–12 unique IDs');
  if (new Set(allCards(content)).size !== allCards(content).length) throw new Error('Card IDs must be globally unique');
  if (!validIds(content.players) || content.players.length < 2 || content.players.length > 6 || content.players.length > allCards(content).length - 3) throw new Error('Require 2–6 players and at least one dealt card each');
  const locations = content.cards.location;
  if (!Array.isArray(content.routes) || content.routes.some(r => !locations.includes(r.from) || !locations.includes(r.to) || r.from === r.to)) throw new Error('Invalid route');
  if (new Set(content.routes.map(r => `${r.from}:${r.to}`)).size !== content.routes.length) throw new Error('Duplicate route');
  for (const start of locations) {
    const reached = new Set([start]);
    for (const at of reached) for (const r of content.routes) if (r.from === at) reached.add(r.to);
    if (reached.size !== locations.length) throw new Error('Location graph must be strongly connected');
  }
}
