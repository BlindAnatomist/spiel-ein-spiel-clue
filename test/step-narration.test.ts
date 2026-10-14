import {test} from 'node:test';
import assert from 'node:assert/strict';
import {GameHost,type Command,type Screen,type Perspective} from '../app/host.ts';
import {stepNarration} from '../app/step-narration.ts';
import {narrate} from '../app/narration.ts';
import {lessons} from '../app/tutorial.ts';
import {content,human} from '../app/content.ts';
import {Referee} from '../src/referee.ts';

function assertBatch(before:Screen,after:Screen){
 const snapshot=structuredClone({before,after}),batch=stepNarration(before,after);
 const fresh=after.events.filter(e=>e.id>(before.events.at(-1)?.id??-1));
 assert.deepEqual(batch.cues.filter(c=>c.kind==='event'),fresh.map(e=>({kind:'event',text:narrate(e),eventId:e.id,eventType:e.data.type})));
 assert.equal(batch.text,batch.cues.map(c=>c.text).join(' '));
 assert.deepEqual({before,after},snapshot);
 return batch;
}
function lessonCommand(s:Screen):Command{
 const l=s.lesson!;
 if(l.kind==='bot')return {kind:'advance'};
 if(l.kind==='action')return {kind:'act',action:s.expected!};
 if(l.kind==='choice')return {kind:'act',action:s.legalActions[0]!};
 return {kind:'continue'};
}

test('every guided step narrates its full new permitted batch, never stale recent events',()=>{
 const host=new GameHost('learn','ignored');let s=host.screen();let reveal=false,end=false,lessonOnly=false;
 const opening=stepNarration(null,s);
 assert.deepEqual(opening.cues.filter(c=>c.kind==='event'),[]);
 assert.match(opening.text,/The missing dispatch/);assert.match(opening.text,/You are Rowan, at Archive/);
 for(let i=0;i<lessons.length-1;i++){
  const before=s;s=host.dispatch(lessonCommand(s),s.revision);const batch=assertBatch(before,s);
  const types=batch.cues.filter(c=>c.kind==='event').map(c=>c.eventType);
  if(types.includes('evidenceRevealed')){reveal=true;assert.deepEqual(types,['refuted','evidenceRevealed','suggestionClosed']);}
  if(types.includes('turnEnded')){end=true;assert.deepEqual(types,['turnEnded','turnStarted']);}
  if(!types.length){lessonOnly=true;assert.deepEqual(s.recent,before.recent);assert.ok(batch.cues.some(c=>c.kind==='lesson'));assert.ok(!batch.text.includes('Private evidence.'));}
 }
 assert.ok(reveal&&end&&lessonOnly);
 const resumed=stepNarration(null,s);assert.deepEqual(resumed.cues.filter(c=>c.kind==='event'),[]);assert.match(resumed.text,/Practice complete/);
});

test('public and every followed perspective narrate only their projected events in order',()=>{
 for(const perspective of ['public',...content.players] as Perspective[]){
  const host=new GameHost('listen','narration-perspectives',perspective);let s=host.screen();let sawReveal=false;
  for(let i=0;i<200&&s.phase.kind!=='finished';i++){
   const before=s;s=host.dispatch({kind:'advance'},s.revision);const batch=assertBatch(before,s);
   for(const cue of batch.cues.filter(c=>c.kind==='event')){
    const event=s.events.find(e=>e.id===cue.eventId)!;
    if(event.visibility==='private')assert.ok(event.recipients.includes(perspective));
    if(cue.eventType==='evidenceRevealed')sawReveal=true;
   }
   if(perspective==='public'){assert.ok(!sawReveal);assert.ok(!batch.text.includes('You are Rowan'));}
  }
  assert.equal(s.phase.kind,'finished');
 }
});

test('accusation consequences and mandatory human response remain complete and explicit',()=>{
 for(const correct of [false,true]){
  const seed='failure',host=new GameHost('play',seed);let s=host.screen();
  while(!s.legalActions.some(a=>a.type==='accuse'))s=host.dispatch(s.legalActions.length?{kind:'act',action:s.legalActions[0]!}:{kind:'advance'},s.revision);
  const solution=new Referee(content,seed).debugSnapshot().solution;
  const hypothesis=correct?solution:{...solution,suspect:content.cards.suspect.find(c=>c!==solution.suspect)!};
  const before=s;s=host.dispatch({kind:'act',action:{type:'accuse',hypothesis}},s.revision);
  const batch=assertBatch(before,s),types=batch.cues.filter(c=>c.kind==='event').map(c=>c.eventType);
  assert.deepEqual(types,correct?['accused','gameEnded']:['accused','turnEnded','turnStarted']);
  assert.match(batch.text,correct?/Correct\./:/Incorrect\. Active turns are lost/);
  if(!correct){
   let response=false;
   for(let i=0;i<200&&s.phase.kind!=='finished';i++){
    if(s.phase.kind==='refutation'&&s.phase.responder===human){
     response=true;assert.match(stepNarration(null,s).text,/must respond/);
     s=host.dispatch({kind:'act',action:s.legalActions[0]!},s.revision);
    }else s=host.dispatch({kind:'advance'},s.revision);
   }
   assert.ok(response);
  }
 }
});
