import { name } from './content.ts';
import type { Screen } from './host.ts';

/** Describe evidence from the selected perspective, without treating an observer as a player. */
export function evidenceCopy(screen: Pick<Screen, 'mode' | 'perspective'>) {
 const following = screen.mode === 'listen' && screen.perspective !== 'public';
 const owner = name(screen.perspective);
 return {
  heldDetail: following ? `${owner} holds this card. It cannot be hidden.` : 'You hold this card. It cannot be hidden.',
  noneShown: following ? `No cards have been shown to ${owner} yet.` : 'No cards have been shown to you yet.',
 };
}
