import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { Referee, replay } from '../src/referee.ts';
import { exampleContent } from '../src/content.ts';
import { baselineBot } from '../src/bot.ts';
import { simulate } from '../src/simulation.ts';
import { categories, type Action, type Hypothesis, type PlayerView } from '../src/types.ts';
import { allCards } from '../src/util.ts';
import { buildNotebook } from '../src/notebook.ts';

function actor(r: Referee): string {
  const phase = r.debugSnapshot().phase;
  if (phase.kind === 'finished') throw new Error('Finished');
  return phase.kind === 'refutation' ? phase.responder : phase.player;
}
function suggestionFixture(minMatches: number) {
  for (let i = 0; i < 300; i++) {
    const r = new Referee(exampleContent, `fixture-${i}`);
    const player = actor(r);
    const view = r.view(player);
    const responder = view.order[1]!;
    for (const action of view.legalActions) if (action.type === 'suggest') {
      const matches = r.debugSnapshot().hands[responder]!.filter(c => Object.values(action.hypothesis).includes(c));
      if (matches.length === minMatches) {
        r.submit(player, action);
        return { r, player, responder, matches, hypothesis: action.hypothesis };
      }
    }
  }
  throw new Error('Fixture not found');
}
function assertRestricted(view: PlayerView) {
  assert.deepEqual(Object.keys(view).sort(), ['rulesVersion', 'player', 'content', 'order', 'investigators', 'phase', 'turn', 'hand', 'notebook', 'events', 'legalActions'].sort());
  const visit = (v: unknown) => {
    if (!v || typeof v !== 'object') return;
    for (const [key, value] of Object.entries(v)) {
      assert.ok(!['seed', 'hands', 'solution', 'reasoning', 'steps'].includes(key), `Secret key ${key}`);
      assert.notEqual(typeof value, 'function');
      visit(value);
    }
  };
  visit(view);
  for (const e of view.events) {
    if (e.visibility === 'private') {
      assert.ok(e.recipients.includes(view.player));
      if (e.data.type === 'handDealt') assert.equal(e.data.player, view.player);
      if (e.data.type === 'evidenceRevealed') assert.ok([e.data.player, e.data.recipient].includes(view.player));
    }
  }
}

test('seeded setup partitions every card exactly once, with one solution card per category', () => {
  for (let i = 0; i < 100; i++) {
    const r = new Referee(exampleContent, `setup-${i}`);
    const { solution, hands } = r.debugSnapshot();
    assert.deepEqual(Object.keys(solution), [...categories]);
    for (const c of categories) assert.ok(exampleContent.cards[c].includes(solution[c]));
    const dealt = Object.values(hands).flat();
    assert.equal(new Set(dealt).size, dealt.length);
    assert.ok(Object.values(solution).every(c => !dealt.includes(c)));
    assert.deepEqual([...dealt, ...Object.values(solution)].sort(), allCards(exampleContent).sort());
    const sizes = Object.values(hands).map(h => h.length);
    assert.ok(Math.max(...sizes) - Math.min(...sizes) <= 1);
    for (const p of exampleContent.players) {
      const v = r.view(p); assertRestricted(v);
      assert.deepEqual(v.hand, hands[p]);
      assert.deepEqual(v.notebook.entries.filter(e => e.eliminatedFromSolution).map(e => e.card).sort(), [...v.hand].sort());
    }
  }
});

test('setup is detached from supplied content and strips extra host fields', () => {
  const content = structuredClone(exampleContent);
  Object.assign(content, { secret: 'hidden' });
  const r = new Referee(content, 'detached');
  content.cards.suspect[0] = 'changed'; content.players.reverse();
  assert.deepEqual(r.view(actor(r)).content, exampleContent);
  assert.deepEqual(r.debugLedger(), new Referee(exampleContent, 'detached').debugLedger());
});

test('multiple refuting cards are offered only to responder, and their chosen card is revealed', () => {
  const { r, player, responder, matches } = suggestionFixture(2);
  assert.deepEqual(r.view(responder).legalActions, matches.map(card => ({ type: 'reveal', card })));
  assert.deepEqual(r.view(player).legalActions, []);
  const before = r.debugLedger();
  assert.throws(() => r.submit(responder, { type: 'pass' }), /Illegal/);
  assert.deepEqual(r.debugLedger(), before);
  const selected = matches[1]!;
  r.submit(responder, { type: 'reveal', card: selected });
  const privateReveal = r.followLedger(player).find(e => e.data.type === 'evidenceRevealed');
  assert.ok(privateReveal && privateReveal.data.type === 'evidenceRevealed');
  assert.equal(privateReveal.data.card, selected);
  assert.equal(r.view(player).notebook.entries.find(e => e.card === selected)!.status, 'directlyRevealed');
  assert.equal(r.view(player).notebook.entries.find(e => e.card === matches[0])!.status, 'unresolved');
});

test('refutation proceeds in order, cannot skip a responder, and stops at first reveal', () => {
  const { r, player, responder } = suggestionFixture(0);
  const order = r.view(player).order;
  assert.deepEqual(r.view(responder).legalActions, [{ type: 'pass' }]);
  assert.throws(() => r.submit(order[2]!, { type: 'pass' }), /Illegal/);
  r.submit(responder, { type: 'pass' });
  assert.equal(actor(r), order[2]);
  assert.ok(r.view(player).notebook.publicFacts.some(f => f.kind === 'cannotHold' && f.player === responder));
  r.submit(actor(r), r.view(actor(r)).legalActions[0]!);
  assert.equal(actor(r), player);
  const phase = r.view(player).phase;
  assert.equal(phase.kind, 'turn');
  assert.ok(!r.view(player).legalActions.some(a => a.type === 'suggest' || a.type === 'move'));
});

test('private evidence is visible only to sender and recipient; public projection stays safe', () => {
  const { r, player, responder, matches } = suggestionFixture(2);
  const third = exampleContent.players.find(p => p !== player && p !== responder)!;
  const before = r.view(third).notebook;
  r.submit(responder, { type: 'reveal', card: matches[1]! });
  for (const p of [player, responder]) assert.ok(r.followLedger(p).some(e => e.data.type === 'evidenceRevealed'));
  assert.ok(!r.followLedger(third).some(e => e.data.type === 'evidenceRevealed'));
  assert.deepEqual(r.view(third).notebook.entries, before.entries);
  assert.ok(r.publicLedger().every(e => e.visibility === 'public'));
  assert.ok(r.view(third).notebook.publicFacts.some(f => f.kind === 'holdsAtLeastOne' && f.player === responder));
  for (const p of exampleContent.players) assertRestricted(r.view(p));
});

test('all-pass suggestion closes without exposing or automatically solving the solution', () => {
  const r = new Referee(exampleContent, 'all-pass');
  const player = actor(r), solution = r.debugSnapshot().solution;
  while (r.view(player).investigators.find(p => p.id === player)!.location !== solution.location) {
    r.stepBot(view => {
      // Fixture navigation using public graph only, independent of the actual policy.
      const move = view.legalActions.find(a => a.type === 'move' && a.destination === solution.location)
        ?? view.legalActions.find(a => a.type === 'move');
      return { action: move ?? { type: 'endTurn' }, reasoning: { code: 'finishTurn', facts: {} } };
    });
    if (actor(r) !== player) r.submit(actor(r), { type: 'endTurn' });
    if (actor(r) !== player) r.submit(actor(r), { type: 'endTurn' });
  }
  r.submit(player, { type: 'suggest', hypothesis: solution });
  for (let i = 1; i < exampleContent.players.length; i++) {
    assert.deepEqual(r.view(actor(r)).legalActions, [{ type: 'pass' }]);
    r.submit(actor(r), { type: 'pass' });
  }
  assert.equal(actor(r), player);
  for (const c of Object.values(solution)) assert.equal(r.view(player).notebook.entries.find(e => e.card === c)!.status, 'unresolved');
  const decision = baselineBot(r.view(player));
  assert.deepEqual(decision.action, { type: 'accuse', hypothesis: solution });
  assert.equal(decision.reasoning.code, 'resolvedSolution');
});

test('movement uses directed adjacent destinations, once before suggesting', () => {
  const r = new Referee(exampleContent, 'movement');
  const player = actor(r), view = r.view(player);
  const location = view.investigators.find(p => p.id === player)!.location;
  const legal = exampleContent.routes.filter(e => e.from === location).map(e => e.to);
  assert.deepEqual(view.legalActions.filter(a => a.type === 'move').map(a => a.destination), legal);
  const illegal = exampleContent.cards.location.find(c => c !== location && !legal.includes(c))!;
  assert.throws(() => r.submit(player, { type: 'move', destination: illegal }), /Illegal/);
  r.submit(player, { type: 'move', destination: legal[0]! });
  assert.ok(!r.view(player).legalActions.some(a => a.type === 'move'));
  assert.ok(r.view(player).legalActions.filter(a => a.type === 'suggest').every(a => a.hypothesis.location === legal[0]));
  const h: Hypothesis = { suspect: 'suspect-a', method: 'method-a', location };
  assert.throws(() => r.submit(player, { type: 'suggest', hypothesis: h }), /Illegal/);
});

test('correct accusation wins and ends every legal action', () => {
  const r = new Referee(exampleContent, 'success'), player = actor(r);
  r.submit(player, { type: 'accuse', hypothesis: r.debugSnapshot().solution });
  assert.deepEqual(r.debugSnapshot().phase, { kind: 'finished', winner: player });
  for (const p of exampleContent.players) assert.deepEqual(r.view(p).legalActions, []);
  assert.throws(() => r.submit(player, { type: 'endTurn' }), /Illegal/);
});

test('failed accusation excludes the triple, ends turns for that player, but retains refutation duty', () => {
  const { r, player, responder, matches } = suggestionFixture(2);
  r.submit(responder, { type: 'reveal', card: matches[0]! });
  const wrong = { ...r.debugSnapshot().solution, suspect: exampleContent.cards.suspect.find(c => c !== r.debugSnapshot().solution.suspect)! };
  r.submit(player, { type: 'accuse', hypothesis: wrong });
  assert.equal(r.view(player).investigators.find(p => p.id === player)!.eliminated, true);
  assert.ok(r.view(player).notebook.publicFacts.some(f => f.kind === 'failedAccusation'));
  assert.notEqual(actor(r), player);
  const next = actor(r);
  r.submit(next, r.view(next).legalActions.find(a => a.type === 'suggest')!);
  while (r.view(next).phase.kind === 'refutation' && actor(r) !== player) {
    const a = r.view(actor(r)).legalActions[0]!;
    r.submit(actor(r), a);
    if (a.type === 'reveal') break;
  }
  // A dedicated fixture with a solution suggestion forces everyone, including the eliminated player, to pass.
  const r2 = new Referee(exampleContent, 'eliminated-pass');
  const out = actor(r2); const solution = r2.debugSnapshot().solution;
  r2.submit(out, { type: 'accuse', hypothesis: { ...solution, method: exampleContent.cards.method.find(c => c !== solution.method)! } });
  let encountered = false;
  for (let i = 0; i < 200 && r2.debugSnapshot().phase.kind !== 'finished'; i++) {
    if (actor(r2) === out) {
      assert.equal(r2.view(out).phase.kind, 'refutation'); encountered = true;
    }
    r2.stepBot(baselineBot);
  }
  assert.ok(encountered);
});

test('all failed accusations produce no winner', () => {
  const r = new Referee(exampleContent, 'all-fail');
  const solution = r.debugSnapshot().solution;
  const wrong = { ...solution, method: exampleContent.cards.method.find(c => c !== solution.method)! };
  for (let i = 0; i < exampleContent.players.length; i++) r.submit(actor(r), { type: 'accuse', hypothesis: wrong });
  assert.deepEqual(r.debugSnapshot().phase, { kind: 'finished', winner: null });
});

test('invalid actions and identities cannot mutate state or ledger', () => {
  const r = new Referee(exampleContent, 'invalid'), player = actor(r);
  const archive = r.archive(), ledger = r.debugLedger();
  for (const action of [null, { type: 'teleport' }, { type: 'endTurn', seed: 'x' }, { type: 'reveal', card: 'suspect-a' }, { type: 'accuse', hypothesis: { suspect: 'x' } }]) {
    assert.throws(() => r.submit(player, action as Action));
    assert.deepEqual(r.archive(), archive); assert.deepEqual(r.debugLedger(), ledger);
  }
  assert.throws(() => r.view('unknown')); assert.throws(() => r.playerPort('unknown'));
  assert.throws(() => r.followLedger('unknown')); assert.throws(() => r.submit('unknown', { type: 'endTurn' }));
});

test('views and player ports are immutable detached capabilities', () => {
  const r = new Referee(exampleContent, 'capability'), player = actor(r);
  const port = r.playerPort(player), view = port.view();
  assert.deepEqual(Object.keys(port).sort(), ['act', 'view']);
  assert.throws(() => view.hand.push('fake'));
  assert.throws(() => { view.notebook.entries[0]!.status = 'unresolved'; });
  assert.throws(() => { view.content.players.reverse(); });
  assertRestricted(view);
  port.act({ type: 'endTurn' });
  assert.throws(() => port.act({ type: 'endTurn' }), /Illegal/);
  assert.equal(view.turn, 1);
});

test('replay regenerates exact ledger, snapshots and every player view', () => {
  const { referee: r, outcome } = simulate(exampleContent, 'replay');
  assert.equal(outcome.kind, 'finished');
  const restored = replay(JSON.parse(JSON.stringify(r.archive())));
  assert.deepEqual(restored.debugLedger(), r.debugLedger());
  assert.deepEqual(restored.debugSnapshot(), r.debugSnapshot());
  for (const p of exampleContent.players) assert.deepEqual(restored.view(p), r.view(p));
  assert.throws(() => replay({ ...r.archive(), rulesVersion: 'future' }), /version/);
});

test('spectator prefixes preserve historical privacy and rebuild independent notebooks', () => {
  const { r, player, responder, matches } = suggestionFixture(2);
  const cutoff = r.debugLedger().at(-1)!.id;
  const before = r.followLedger(player, cutoff);
  const notebookBefore = r.view(player).notebook;
  r.submit(responder, { type: 'reveal', card: matches[0]! });
  assert.deepEqual(r.followLedger(player, cutoff), before);
  assert.deepEqual(buildNotebook(exampleContent, player, r.followLedger(player, cutoff)), notebookBefore);
  assert.ok(r.publicLedger(cutoff).every(e => e.id <= cutoff));
  assert.ok(r.debugLedger().some(e => e.visibility === 'referee' && e.data.type === 'setup'));
});

test('different private reveal choices produce identical uninvolved-player observations', () => {
  const { r, player, responder, matches } = suggestionFixture(2);
  const alternate = replay(r.archive());
  const observer = exampleContent.players.find(p => p !== player && p !== responder)!;
  r.submit(responder, { type: 'reveal', card: matches[0]! });
  alternate.submit(responder, { type: 'reveal', card: matches[1]! });
  assert.deepEqual(r.publicLedger(), alternate.publicLedger());
  assert.deepEqual(r.view(observer), alternate.view(observer));
  assert.notDeepEqual(r.view(player), alternate.view(player));
  assert.notDeepEqual(r.debugLedger(), alternate.debugLedger());
});

test('reference game matches the versioned ledger regression', () => {
  const result = simulate(exampleContent, 'checkpoint-1');
  assert.equal(result.actions, 62);
  assert.equal(result.turns, 16);
  assert.deepEqual(result.outcome, { kind: 'finished', winner: 'investigator-b' });
  const digest = createHash('sha256').update(JSON.stringify(result.referee.debugLedger())).digest('hex');
  assert.equal(digest, '13260693052c3f54f6766c28fe91ebacffb98914c25c496bba65a277890763cd');
});

test('baseline receives only a permitted serializable view, records actual decisions, and wins across seeds', () => {
  for (let seed = 0; seed < 30; seed++) {
    let calls = 0;
    const { referee, outcome, actions } = simulate(exampleContent, `bots-${seed}`, { policy: view => {
      calls++; assertRestricted(view);
      const roundTrip = JSON.parse(JSON.stringify(view)) as PlayerView;
      const decision = baselineBot(roundTrip);
      assert.ok(view.legalActions.some(a => JSON.stringify(a) === JSON.stringify(decision.action)));
      assert.deepEqual(baselineBot(view), decision);
      return decision;
    } });
    assert.equal(outcome.kind, 'finished');
    if (outcome.kind === 'finished') assert.ok(outcome.winner);
    assert.equal(calls, actions);
    assert.equal(referee.debugLedger().filter(e => e.data.type === 'botDecision').length, actions);
    assert.ok(!referee.publicLedger().some(e => (e.data as { type: string }).type === 'botDecision'));
  }
});

test('same seed and policy yield exactly reproducible games; action limits are explicit', () => {
  const a = simulate(exampleContent, 'stable'), b = simulate(exampleContent, 'stable');
  assert.deepEqual(a.referee.debugLedger(), b.referee.debugLedger());
  assert.equal(simulate(exampleContent, 'stable', { maxActions: 1 }).outcome.kind, 'actionLimit');
  assert.throws(() => simulate(exampleContent, 'stable', { maxActions: 0 }));
});

test('invalid content is rejected and directed strongly connected graphs are supported', () => {
  for (const change of [
    (c: typeof exampleContent) => { c.cards.suspect = []; },
    (c: typeof exampleContent) => { c.cards.method[0] = c.cards.suspect[0]!; },
    (c: typeof exampleContent) => { c.players = ['one']; },
    (c: typeof exampleContent) => { c.routes = []; },
    (c: typeof exampleContent) => { c.routes.push(c.routes[0]!); },
    (c: typeof exampleContent) => { c.routes[0]!.to = 'unknown'; },
  ]) {
    const c = structuredClone(exampleContent); change(c);
    assert.throws(() => new Referee(c, 'invalid'));
  }
  const c = structuredClone(exampleContent);
  c.routes = c.cards.location.map((from, i) => ({ from, to: c.cards.location[(i + 1) % c.cards.location.length]! }));
  assert.equal(simulate(c, 'directed').outcome.kind, 'finished');
  assert.throws(() => new Referee(exampleContent, ''));
});
