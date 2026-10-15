import {test} from 'node:test';
import assert from 'node:assert/strict';
import {GameHost,type Command,type Screen,type Perspective} from '../app/host.ts';
import {orientation,stepNarration} from '../app/step-narration.ts';
import {narrate} from '../app/narration.ts';
import {lessons} from '../app/tutorial.ts';
import {content,human,name} from '../app/content.ts';
import {Referee} from '../src/referee.ts';

function assertBatch(before:Screen,after:Screen){
 const snapshot=structuredClone({before,after}),batch=stepNarration(before,after);
 const fresh=after.events.filter(e=>e.id>(before.events.at(-1)?.id??-1));
 assert.deepEqual(batch.cues.filter(c=>c.kind==='event'),fresh.map(e=>({kind:'event',text:narrate(e),eventId:e.id,eventType:e.data.type})));
 assert.equal(batch.text,batch.cues.map(c=>c.text).join(' '));
 assert.ok(batch.repeatText.includes(orientation(after)));
 let previous=-1;
 for(const cue of batch.cues.filter(c=>c.kind!=='orientation')){
  const index=batch.repeatText.indexOf(cue.text,previous+1);
  assert.ok(index>previous,`Repeat must retain ${cue.kind} in order`);previous=index;
 }
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
 assert.equal(opening.repeatText,opening.text);
 assert.match(opening.text,/The missing dispatch/);assert.match(opening.text,/You are Rowan, at Archive/);
 for(let i=0;i<lessons.length-1;i++){
  const before=s;s=host.dispatch(lessonCommand(s),s.revision);const batch=assertBatch(before,s);
  const types=batch.cues.filter(c=>c.kind==='event').map(c=>c.eventType);
  assert.ok(!batch.text.includes('You are Rowan'),`No repeated identity at ${s.lesson!.title}`);
  if(types.includes('evidenceRevealed')){reveal=true;assert.deepEqual(types,['refuted','evidenceRevealed','suggestionClosed']);}
  if(types.includes('turnEnded')){end=true;assert.deepEqual(types,['turnEnded','turnStarted']);}
  if(!types.length){lessonOnly=true;assert.deepEqual(s.recent,before.recent);assert.ok(batch.cues.some(c=>c.kind==='lesson'));assert.ok(!batch.text.includes('Private evidence.'));assert.deepEqual(batch.cues.filter(c=>c.kind==='orientation'),[]);}
 }
 assert.ok(reveal&&end&&lessonOnly);
 const resumed=stepNarration(null,s);assert.deepEqual(resumed.cues.filter(c=>c.kind==='event'),[]);assert.match(resumed.text,/Practice complete/);
});

test('other investigators keep the floor without repeating the listener identity or location',()=>{
 const host=new GameHost('learn','ignored');let s=host.screen();
 while(s.revision<8)s=host.dispatch(lessonCommand(s),s.revision);
 let before=s;s=host.dispatch(lessonCommand(s),s.revision);
 let batch=assertBatch(before,s);
 assert.match(batch.text,/Rowan ended the turn\. Lena’s turn\./);
 assert.deepEqual(batch.cues.filter(c=>c.kind==='orientation'),[]);
 assert.ok(!batch.text.includes('Workshop'));
 assert.match(batch.repeatText,/You are Rowan, at Workshop\. Lena’s turn, at Garden\./);

 before=s;s=host.dispatch(lessonCommand(s),s.revision);batch=assertBatch(before,s);
 assert.match(batch.text,/Lena asks: Mira, Copied key, Garden\?/);
 assert.deepEqual(batch.cues.filter(c=>c.kind==='orientation').map(c=>c.text),['Otis must respond.']);
 assert.ok(!batch.text.includes('Lena asked:'));
 assert.ok(!batch.text.includes('Workshop'));

 before=s;s=host.dispatch(lessonCommand(s),s.revision);batch=assertBatch(before,s);
 assert.deepEqual(batch.cues.filter(c=>c.kind==='orientation').map(c=>c.text),['Your response to Lena.']);
 assert.match(batch.text,/Choose one matching card to show privately to Lena\./);
 assert.ok(!batch.text.includes('Rowan'));

 before=s;s=host.dispatch(lessonCommand(s),s.revision);batch=assertBatch(before,s);
 assert.deepEqual(batch.cues.filter(c=>c.kind==='orientation').map(c=>c.text),['Lena’s turn continues.']);
 assert.match(batch.text,/Private evidence\. Rowan showed Lena: /);
 assert.ok(!batch.text.includes('Workshop'));
});

test('orientation does not repeat movement events and returning to your turn restores useful location',()=>{
 const host=new GameHost('learn','ignored');let s=host.screen();
 while(s.revision<2)s=host.dispatch(lessonCommand(s),s.revision);
 let before=s;s=host.dispatch(lessonCommand(s),s.revision);
 let batch=assertBatch(before,s);
 assert.match(batch.text,/Rowan moved from Archive to Workshop\./);
 assert.deepEqual(batch.cues.filter(c=>c.kind==='orientation'),[]);
 assert.match(batch.repeatText,/You are Rowan, at Workshop\./);

 while(s.revision<14)s=host.dispatch(lessonCommand(s),s.revision);
 before=s;s=host.dispatch(lessonCommand(s),s.revision);batch=assertBatch(before,s);
 assert.match(batch.text,/Otis moved from Workshop to Garden\./);
 assert.deepEqual(batch.cues.filter(c=>c.kind==='orientation'),[]);
 assert.ok(!batch.text.includes('Rowan'));

 while(s.revision<18)s=host.dispatch(lessonCommand(s),s.revision);
 before=s;s=host.dispatch(lessonCommand(s),s.revision);batch=assertBatch(before,s);
 assert.match(batch.text,/Otis ended the turn\. Rowan’s turn\./);
 assert.deepEqual(batch.cues.filter(c=>c.kind==='orientation').map(c=>c.text),['You are at Workshop.']);
});

test('ordinary play gives the next decision after a question without repeating identity or location',()=>{
 const host=new GameHost('play','plain-narration');let s=host.screen();
 const suggestion=s.legalActions.find(a=>a.type==='suggest')!;
 assert.ok(suggestion);
 s=host.dispatch({kind:'act',action:suggestion},s.revision);
 while(s.phase.kind==='refutation'){
  const before=s;s=host.dispatch({kind:'advance'},s.revision);
  const batch=assertBatch(before,s);
  assert.ok(!batch.text.includes('You are Rowan'));
  if(s.phase.kind==='turn'){
   assert.deepEqual(batch.cues.filter(c=>c.kind==='orientation').map(c=>c.text),['Your turn continues. You can accuse or end your turn.']);
   assert.match(batch.repeatText,/You are Rowan, at Workshop\./);
  }
 }
 assert.equal(s.phase.kind,'turn');
});

test('resuming a pending response restores full orientation without replaying history',()=>{
 const host=new GameHost('learn','ignored');let s=host.screen();
 while(s.revision<11)s=host.dispatch(lessonCommand(s),s.revision);
 const batch=stepNarration(null,s);
 assert.match(batch.text,/You are Rowan, at Workshop\. Lena asked: Mira, Copied key, Garden\. Rowan must respond\./);
 assert.deepEqual(batch.cues.filter(c=>c.kind==='event'),[]);
 assert.ok(!batch.text.includes('Private evidence.'));
 assert.equal(batch.text,batch.repeatText);
});

test('changed perspective and location retain orientation when no event supplies it',()=>{
 const host=new GameHost('listen','orientation-change','investigator-b');const s=host.screen();
 const publicScreen={...s,perspective:'public' as const};
 assert.ok(stepNarration(publicScreen,s).text.includes(orientation(s)));
 assert.ok(stepNarration(s,publicScreen).text.includes(orientation(publicScreen)));
 assert.equal(s.phase.kind,'turn');if(s.phase.kind!=='turn')throw Error();
 const actor=s.phase.player;
 const current=s.investigators.find(p=>p.id===actor)!;
 const destination=content.cards.location.find(c=>c!==current.location)!;
 const moved={...s,investigators:s.investigators.map(p=>p.id===actor?{...p,location:destination}:p)};
 const batch=stepNarration(s,moved);
 assert.deepEqual(batch.cues.filter(c=>c.kind==='orientation').map(c=>c.text),[`${name(actor)} is now at ${name(destination)}.`]);
});

test('public and every followed perspective narrate only their projected events in order',()=>{
 for(const perspective of ['public',...content.players] as Perspective[]){
  const host=new GameHost('listen','narration-perspectives',perspective);let s=host.screen();let sawReveal=false;
  for(let i=0;i<200&&s.phase.kind!=='finished';i++){
   const before=s;s=host.dispatch({kind:'advance'},s.revision);const batch=assertBatch(before,s);
   assert.ok(!batch.text.includes('Following '));
   assert.ok(!batch.text.includes('Public observation.'));
   for(const cue of batch.cues.filter(c=>c.kind==='event')){
    const event=s.events.find(e=>e.id===cue.eventId)!;
    if(event.visibility==='private')assert.ok(event.recipients.includes(perspective));
    if(cue.eventType==='evidenceRevealed')sawReveal=true;
   }
   if(perspective==='public'){assert.ok(!sawReveal);assert.ok(!batch.text.includes('You are Rowan'));assert.ok(!batch.repeatText.includes('Private evidence.'));}
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
