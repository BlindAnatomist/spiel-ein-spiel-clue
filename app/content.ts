import type { Content, Hypothesis } from '../src/types.ts';
export const human = 'investigator-a';
export const content: Content = {
  cards: { suspect: ['suspect-a', 'suspect-b', 'suspect-c'], method: ['method-a', 'method-b', 'method-c'], location: ['location-a', 'location-b', 'location-c'] },
  players: [human, 'investigator-b', 'investigator-c'],
  routes: ['location-a', 'location-b', 'location-c'].flatMap(from => ['location-a', 'location-b', 'location-c'].filter(to => to !== from).map(to => ({from,to}))),
};
const labels: Record<string, string> = {
  'investigator-a': 'Rowan', 'investigator-b': 'Lena', 'investigator-c': 'Otis',
  'suspect-a': 'Mira', 'suspect-b': 'Dorian', 'suspect-c': 'Selene',
  'method-a': 'Copied key', 'method-b': 'Forged message', 'method-c': 'Cut cable',
  'location-a': 'Archive', 'location-b': 'Workshop', 'location-c': 'Garden',
};
export const name = (id: string): string => labels[id] ?? 'Unknown item';
export const triple = (h: Hypothesis): string => `${name(h.suspect)}, ${name(h.method)}, ${name(h.location)}`;
