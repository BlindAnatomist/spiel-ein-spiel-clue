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
export interface StepNarration { cues: NarrationCue[]; text: string }

export function orientation(s: Screen): string {
 const person=s.investigators.find(p=>p.id===s.perspective);
 const identity=s.mode==='listen'
  ? person?`Following ${name(person.id)}, at ${name(person.location)}.`:'Public observation.'
  : `You are ${name(human)}, at ${name(person!.location)}.`;
 return `${identity} ${situation(s.phase,s.investigators)}`;
}

export function nextPrompt(s: Screen): string {
 const l=s.lesson;
 if(l){
  if(l.kind==='continue')return 'Choose Continue when ready.';
  if(l.kind==='hand')return 'Review your starting evidence, then return and choose Continue lesson.';
  if(l.kind==='notebook')return `Find ${name(l.card!)} in the notebook, then return and choose Continue lesson.`;
  if(l.kind==='bot')return 'Choose Next exchange when ready.';
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
 if(s.mode==='listen'||!s.legalActions.length)return 'Choose Next exchange when ready.';
 if(s.phase.kind==='refutation')return s.legalActions.some(a=>a.type==='reveal')
  ? `Choose one matching card to show privately to ${name(s.phase.player)}.`
  : 'Choose Cannot refute.';
 return 'Choose your next action when ready.';
}

export function stepNarration(before: Screen|null, after: Screen): StepNarration {
 const cues:NarrationCue[]=[];
 // Opening/resuming announces the present position, never the replayed journal.
 // Screen.recent can be stale after a lesson-only Continue, so do not use it here.
 if(before){
  const lastId=before.events.at(-1)?.id??-1;
  for(const e of after.events.filter(e=>e.id>lastId))cues.push({kind:'event',text:narrate(e),eventId:e.id,eventType:e.data.type});
 }
 if(after.lesson&&(!before||before.lesson?.title!==after.lesson.title||before.lesson.text!==after.lesson.text)){
  cues.push({kind:'lesson',text:`${after.lesson.title}. ${after.lesson.text}`});
 }
 cues.push({kind:'orientation',text:orientation(after)},{kind:'prompt',text:nextPrompt(after)});
 if(after.storageWarning&&after.storageWarning!==before?.storageWarning)cues.push({kind:'prompt',text:after.storageWarning});
 return {cues,text:cues.map(c=>c.text).join(' ')};
}
