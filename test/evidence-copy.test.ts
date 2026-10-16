import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evidenceCopy } from '../app/evidence-copy.ts';
import { GameHost, type Perspective } from '../app/host.ts';
import { content, human, name } from '../app/content.ts';

for (const perspective of content.players as Perspective[]) {
 test(`followed evidence names ${perspective}, including following the ordinary human identity`, () => {
  const host = new GameHost('listen', 'evidence-ownership', perspective);
  const before = host.screen();
  const copy = evidenceCopy(before);
  assert.equal(copy.heldDetail, `${name(perspective)} holds this card. It cannot be hidden.`);
  assert.equal(copy.noneShown, `No cards have been shown to ${name(perspective)} yet.`);
  assert.doesNotMatch(Object.values(copy).join(' '), /\byou\b/i);
  assert.deepEqual(host.screen(), before);
 });
}

for (const mode of ['learn', 'play'] as const) {
 test(`${mode} preserves player-directed evidence wording`, () => {
  const screen = new GameHost(mode, 'evidence-ownership').screen();
  assert.equal(screen.perspective, human);
  assert.deepEqual(evidenceCopy(screen), {
   heldDetail: 'You hold this card. It cannot be hidden.',
   noneShown: 'No cards have been shown to you yet.',
  });
 });
}

test('public observation still exposes no private evidence or notebook', () => {
 const screen = new GameHost('listen', 'evidence-ownership', 'public').screen();
 assert.deepEqual(screen.hand, []);
 assert.equal(screen.notebook, null);
 assert.ok(screen.events.every(event => event.visibility === 'public'));
});
