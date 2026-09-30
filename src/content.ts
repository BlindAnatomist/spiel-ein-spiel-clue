import type { Content } from './types.ts';
/** Test/development vocabulary only; replace with any validated abstract content. */
export const exampleContent: Content = {
  cards: {
    suspect: ['suspect-a', 'suspect-b', 'suspect-c', 'suspect-d'],
    method: ['method-a', 'method-b', 'method-c', 'method-d'],
    location: ['location-a', 'location-b', 'location-c', 'location-d'],
  },
  routes: [
    { from: 'location-a', to: 'location-b' }, { from: 'location-b', to: 'location-a' },
    { from: 'location-b', to: 'location-c' }, { from: 'location-c', to: 'location-b' },
    { from: 'location-c', to: 'location-d' }, { from: 'location-d', to: 'location-c' },
    { from: 'location-d', to: 'location-a' }, { from: 'location-a', to: 'location-d' },
  ],
  players: ['investigator-a', 'investigator-b', 'investigator-c'],
};
