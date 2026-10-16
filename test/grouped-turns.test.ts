import {test} from 'node:test';
import assert from 'node:assert/strict';
import {GameHost,type Command,type Screen,type StoragePort,type Perspective} from '../app/host.ts';
import {advanceLabel,stepNarration} from '../app/step-narration.ts';
import {narrate} from '../app/narration.ts';
import {lessons} from '../app/tutorial.ts';
import {content,human} from '../app/content.ts';
import {Referee} from '../src/referee.ts';
import {baselineBot} from '../src/bot.ts';

class Memory implements StoragePort {
 data=new Map<string,string>();
 getItem(key:string){return this.data.get(key)??null;}
 setItem(key:string,value:string){this.data.set(key,value);}
 removeItem(key:string){this.data.delete(key);}
}
function command(s:Screen):Command {
 const lesson=s.lesson!;
 if(lesson.kind==='bot')return {kind:'advanceTurn'};
 if(lesson.kind==='action')return {kind:'act',action:s.expected!};
 if(lesson.kind==='choice')return {kind:'act',action:s.legalActions[0]!};
 return {kind:'continue'};
}
function fresh(before:Screen,after:Screen){return after.events.filter(e=>e.id>(before.events.at(-1)?.id??-1));}
function checkBatch(before:Screen,after:Screen){
 const events=fresh(before,after),batch=stepNarration(before,after);
 assert.deepEqual(batch.cues.filter(c=>c.kind==='event').map(c=>({id:c.eventId,text:c.text})),events.map(e=>({id:e.id,text:narrate(e)})));
 assert.deepEqual(after.recent,events);
 let previous=-1;
 for(const event of events){const index=batch.repeatText.indexOf(narrate(event),previous+1);assert.ok(index>previous);previous=index;}
 // Ending a turn may announce the next investigator, but may not run their action.
 if(after.turn!==before.turn){
  assert.equal(events.at(-1)?.data.type,'turnStarted');
  assert.equal(events.filter(e=>e.data.type==='turnStarted').length,1);
 }
 for(const event of events)if(event.visibility==='private')assert.ok(event.recipients.includes(after.perspective));
 return events.map(e=>e.data.type);
}

test('grouped practice preserves every teaching checkpoint and both human reveal choices',()=>{
 for(const choice of [0,1]){
  const storage=new Memory(),host=new GameHost('learn','ignored','public',storage);host.persist();
  let s=host.screen(),groups=0;const seen:Screen['lesson'][]=[];
  for(let i=0;i<lessons.length;i++){
   const l=s.lesson!;
   if(l.kind!=='bot')seen.push(l);
   if(l.kind==='finished')break;
   const before=s,c=l.kind==='choice'?{kind:'act' as const,action:s.legalActions[choice]!}:command(s);
   s=host.dispatch(c,s.revision);
   assert.equal(s.revision,before.revision+1);
   if(c.kind==='advanceTurn'){
    const types=checkBatch(before,s);if(types.filter(t=>['moved','suggested','passed','refuted','turnEnded'].includes(t)).length>1)groups++;
    assert.ok(s.turn!==before.turn||s.lesson!.kind!=='bot'||s.legalActions.length>0);
   }
   assert.deepEqual(GameHost.restore('learn',storage).screen(),s);
  }
  assert.equal(s.phase.kind,'finished');assert.ok(groups>=4);
  assert.deepEqual(seen,lessons.filter(l=>l.kind!=='bot').map(l=>({title:l.title,text:l.text,kind:l.kind,...(l.card?{card:l.card}:{})})));
 }
});

test('a bot turn pauses at human reveal/pass, then resumes only after a manual command',()=>{
 const host=new GameHost('learn','ignored');let s=host.screen();
 while(advanceLabel(s)!=='Start Lena’s turn'||s.lesson?.kind!=='bot')s=host.dispatch(command(s),s.revision);
 let before=s;s=host.dispatch({kind:'advanceTurn'},s.revision);
 assert.deepEqual(checkBatch(before,s),['suggested','passed']);
 assert.equal(s.lesson!.kind,'choice');assert.equal(s.phase.kind,'refutation');
 if(s.phase.kind!=='refutation')throw Error();assert.equal(s.phase.responder,human);
 assert.throws(()=>host.dispatch({kind:'advanceTurn'},s.revision),/human/);assert.deepEqual(host.screen(),s);
 before=s;s=host.dispatch({kind:'act',action:s.legalActions[0]!},s.revision);
 assert.deepEqual(checkBatch(before,s),['refuted','evidenceRevealed','suggestionClosed']);
 assert.equal(s.lesson!.title,'One card, one recipient');assert.equal(s.turn,before.turn);
 s=host.dispatch({kind:'continue'},s.revision);assert.equal(advanceLabel(s),'Continue Lena’s turn');
 before=s;s=host.dispatch({kind:'advanceTurn'},s.revision);
 assert.deepEqual(checkBatch(before,s),['turnEnded','turnStarted']);assert.equal(advanceLabel(s),'Start Otis’s turn');
 before=s;s=host.dispatch({kind:'advanceTurn'},s.revision);
 assert.deepEqual(checkBatch(before,s),['moved','suggested']);assert.equal(s.lesson!.title,'When you cannot refute');
 assert.deepEqual(s.legalActions,[{type:'pass'}]);
 before=s;s=host.dispatch({kind:'act',action:{type:'pass'}},s.revision);
 assert.deepEqual(checkBatch(before,s),['passed']);assert.equal(s.turn,before.turn);assert.equal(advanceLabel(s),'Continue Otis’s turn');
 before=s;s=host.dispatch({kind:'advanceTurn'},s.revision);
 assert.deepEqual(checkBatch(before,s),['refuted','suggestionClosed','turnEnded','turnStarted']);
 assert.equal(s.lesson!.title,'Test another location');assert.ok(s.legalActions.length>0);
});

test('ordinary grouped turns match individual engine actions and stop at every human decision',()=>{
 for(let seed=0;seed<8;seed++){
  const storage=new Memory(),host=new GameHost('play',`group-${seed}`,'public',storage),ref=new Referee(content,`group-${seed}`);
  let s=host.screen(),responses=0,groups=0;
  for(let n=0;n<400&&s.phase.kind!=='finished';n++){
   const before=s,view=ref.view(human);
   if(view.legalActions.length){
    if(view.phase.kind==='refutation')responses++;
    const decision=baselineBot(view);s=host.dispatch({kind:'act',action:decision.action},s.revision);ref.submit(human,decision.action);
   }else{
    s=host.dispatch({kind:'advanceTurn'},s.revision);groups++;
    do{
     ref.stepBot(baselineBot);const next=ref.view(human);
     if(next.phase.kind==='finished'||next.turn!==view.turn||next.legalActions.length)break;
    }while(true);
    const events=checkBatch(before,s);
    assert.ok(!fresh(before,s).some(e=>['moved','suggested','passed','refuted','accused'].includes(e.data.type)&&'player' in e.data&&e.data.player===human));
    assert.ok(events.length>0);
   }
   assert.deepEqual(s.events,ref.followLedger(human));
   assert.deepEqual(s.phase,ref.view(human).phase);assert.deepEqual(s.investigators,ref.view(human).investigators);
   assert.deepEqual(GameHost.restore('play',storage).screen(),s);
  }
  assert.equal(s.phase.kind,'finished');assert.ok(groups>0&&responses>0);
 }
});

test('public and followed grouped observation complete one turn per press with permitted narration',()=>{
 for(const perspective of ['public',...content.players] as Perspective[]){
  const host=new GameHost('listen','grouped-listening',perspective),ref=new Referee(content,'grouped-listening');let s=host.screen();
  for(let n=0;n<100&&s.phase.kind!=='finished';n++){
   const before=s;s=host.dispatch({kind:'advanceTurn'},s.revision);checkBatch(before,s);
   do{ref.stepBot(baselineBot);}while(ref.view(human).phase.kind!=='finished'&&ref.view(human).turn===before.turn);
   assert.deepEqual(s.events,perspective==='public'?ref.publicLedger():ref.followLedger(perspective));
   assert.ok(s.phase.kind==='finished'||s.turn===before.turn+1);
   if(perspective==='public')assert.ok(!stepNarration(before,s).repeatText.includes('Private evidence.'));
  }
  assert.equal(s.phase.kind,'finished');
 }
});

test('legacy single-action saves resume mid-turn and can continue with grouped commands',()=>{
 const storage=new Memory(),host=new GameHost('learn','ignored','public',storage);let s=host.screen();
 // The original UI saved one advance at a time, including this mid-refutation stop.
 while(s.revision<10){const c=command(s);s=host.dispatch(c.kind==='advanceTurn'?{kind:'advance'}:c,s.revision);}
 assert.equal(s.lesson!.text,'Otis is asked first.');
 const restored=GameHost.restore('learn',storage);assert.deepEqual(restored.screen(),s);
 const before=s;s=restored.dispatch({kind:'advanceTurn'},s.revision);
 assert.deepEqual(checkBatch(before,s),['passed']);assert.equal(s.lesson!.kind,'choice');
 assert.deepEqual(GameHost.restore('learn',storage).screen(),s);
 assert.throws(()=>restored.dispatch({kind:'advanceTurn'},before.revision),/already/);assert.deepEqual(restored.screen(),s);
 const opening=stepNarration(null,s);assert.equal(opening.cues.some(c=>c.kind==='event'),false);assert.match(opening.text,/Rowan must respond/);
});

test('failed accusation still pauses grouped turns for the eliminated human to respond',()=>{
 const host=new GameHost('play','failure');let s=host.screen();
 while(!s.legalActions.some(a=>a.type==='accuse'))s=host.dispatch(s.legalActions.length?{kind:'act',action:s.legalActions[0]!}:{kind:'advanceTurn'},s.revision);
 const solution=new Referee(content,'failure').debugSnapshot().solution;
 s=host.dispatch({kind:'act',action:{type:'accuse',hypothesis:{...solution,suspect:content.cards.suspect.find(c=>c!==solution.suspect)!}}},s.revision);
 let responses=0;
 for(let i=0;i<200&&s.phase.kind!=='finished';i++){
  const before=s;
  if(s.legalActions.length){
   assert.equal(s.phase.kind,'refutation');responses++;
   assert.throws(()=>host.dispatch({kind:'advanceTurn'},s.revision),/human/);assert.deepEqual(host.screen(),s);
   s=host.dispatch({kind:'act',action:s.legalActions[0]!},s.revision);
  }else{s=host.dispatch({kind:'advanceTurn'},s.revision);checkBatch(before,s);}
 }
 assert.ok(responses>0);assert.equal(s.phase.kind,'finished');
 assert.throws(()=>host.dispatch({kind:'advanceTurn'},s.revision),/ended/);assert.deepEqual(host.screen(),s);
});
