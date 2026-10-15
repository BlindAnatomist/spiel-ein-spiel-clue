import type { Screen } from './host.ts';
import { human, name } from './content.ts';
import { narrate, situation } from './narration.ts';
import type { VisibleEvent } from '../src/types.ts';

// Presentation-only cues. A later recording player can consume this same permitted
// sequence; neither speech nor clip completion is a game command.
export interface NarrationCue {
 kind: 'event' | 'lesson' | 'orientation' | 'prompt';
 text: string;
 eventId?: number;
 eventType?: VisibleEvent['data']['type'];
}
export interface StepNarration { cues: NarrationCue[]; text: string; repeatText: string }

export function orientation(s: Screen): string {
 const person=s.investigators.find(p=>p.id===s.perspective);
 const identity=s.mode==='listen'
  ? person?`Following ${name(person.id)}, at ${name(person.location)}.`:'Public observation.'
  : `You are ${name(human)}, at ${name(person!.location)}.`;
 return `${identity} ${situation(s.phase,s.investigators)}`;
}

function stepOrientation(before: Screen|null, after: Screen, fresh: VisibleEvent[]): string {
 // Full orientation is useful on entry/resume and always available on demand.
 // During play, describe the changed context without reintroducing the listener.
 if(!before||before.mode!==after.mode||before.perspective!==after.perspective)return orientation(after);
 const phase=after.phase, previous=before.phase;
 if(phase.kind==='finished')return fresh.some(e=>e.data.type==='gameEnded')?'':situation(phase,after.investigators);
 if(phase.kind==='refutation'){
  if(previous.kind==='refutation'&&previous.suggestionId===phase.suggestionId&&previous.responder===phase.responder)return '';
  return after.mode!=='listen'&&phase.responder===human
   ? `Your response to ${name(phase.player)}.`
   : `${name(phase.responder)} must respond.`;
 }
 const person=after.investigators.find(p=>p.id===phase.player)!;
 const isHuman=after.mode!=='listen'&&phase.player===human;
 const newTurn=before.turn!==after.turn||previous.kind==='finished'||previous.player!==phase.player;
 if(newTurn){
  // Guided handoffs already name the next actor in the turn event and lesson.
  if(after.lesson&&!isHuman&&fresh.some(e=>e.data.type==='turnStarted'&&e.data.player===person.id))return '';
  return `${isHuman?'You are':`${name(person.id)} is`} at ${name(person.location)}.`;
 }
 if(previous.kind==='refutation')return isHuman
  ? `Your turn continues.${after.mode==='play'?' You can accuse or end your turn.':''}`
  : `${name(phase.player)}’s turn continues.`;
 // A movement event already names its actor, origin and destination. Only add
 // location here if it changed without that event in the permitted batch.
 const moved=before.investigators.find(p=>p.id===person.id)?.location!==person.location;
 if(moved&&!fresh.some(e=>e.data.type==='moved'&&e.data.player===person.id&&e.data.to===person.location)){
  return `${isHuman?'You are':`${name(person.id)} is`} now at ${name(person.location)}.`;
 }
 return '';
}

export function advanceLabel(s: Screen): string {
 const phase=s.phase;
 if(phase.kind==='finished')return 'Return to menu';
 if(s.mode!=='listen'&&phase.player===human)return 'Hear the responses';
 return `${phase.kind==='turn'&&!phase.moved&&!phase.suggested?'Start':'Continue'} ${name(phase.player)}’s turn`;
}

export function nextPrompt(s: Screen): string {
 const l=s.lesson;
 if(l){
  if(l.kind==='continue')return 'Choose Continue when ready.';
  if(l.kind==='hand')return 'Review your starting evidence, then return and choose Continue lesson.';
  if(l.kind==='notebook')return `Find ${name(l.card!)} in the notebook, then return and choose Continue lesson.`;
  if(l.kind==='bot')return `Choose ${advanceLabel(s)} when ready.`;
  if(l.kind==='finished')return 'Choose a fresh game when ready.';
  if(l.kind==='action'&&s.expected){
   const a=s.expected;
   if(a.type==='move')return `Choose Move to ${name(a.destination)}.`;
   if(a.type==='suggest')return 'Choose Make a suggestion.';
   if(a.type==='accuse')return 'Choose Make a final accusation. You will review it before confirming.';
   if(a.type==='endTurn')return 'Choose End turn when ready.';
  }
 }
 if(s.phase.kind==='finished')return 'Return to menu when ready.';
 if(s.mode==='listen'||!s.legalActions.length)return `Choose ${advanceLabel(s)} when ready.`;
 if(s.phase.kind==='refutation')return s.legalActions.some(a=>a.type==='reveal')
  ? `Choose one matching card to show privately to ${name(s.phase.player)}.`
  : 'Choose Cannot refute.';
 return 'Choose your next action when ready.';
}

export function stepNarration(before: Screen|null, after: Screen): StepNarration {
 const cues:NarrationCue[]=[];
 // Opening/resuming announces the present position, never the replayed journal.
 // Screen.recent can be stale after a lesson-only Continue, so do not use it here.
 const lastId=before?.events.at(-1)?.id??-1;
 const fresh=before?after.events.filter(e=>e.id>lastId):[];
 for(const e of fresh)cues.push({kind:'event',text:narrate(e),eventId:e.id,eventType:e.data.type});
 if(after.lesson&&(!before||before.lesson?.title!==after.lesson.title||before.lesson.text!==after.lesson.text)){
  cues.push({kind:'lesson',text:`${after.lesson.title}. ${after.lesson.text}`});
 }
 const context=stepOrientation(before,after,fresh);
 const prompts:NarrationCue[]=[{kind:'prompt',text:nextPrompt(after)}];
 if(after.storageWarning&&after.storageWarning!==before?.storageWarning)prompts.push({kind:'prompt',text:after.storageWarning});
 // Repeat is self-contained even if automatic speech was interrupted. It keeps
 // this step's events and lesson, with full current orientation before the prompt.
 const repeatText=[...cues.map(c=>c.text),orientation(after),...prompts.map(c=>c.text)].join(' ');
 if(context)cues.push({kind:'orientation',text:context});
 cues.push(...prompts);
 return {cues,text:cues.map(c=>c.text).join(' '),repeatText};
}
