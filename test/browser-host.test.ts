import {test} from 'node:test';
import assert from 'node:assert/strict';
import {GameHost,type StoragePort,type Mode,type Command,type Screen} from '../app/host.ts';
import {lessons} from '../app/tutorial.ts';
import {human,content} from '../app/content.ts';
import {Referee,replay} from '../src/referee.ts';
import {baselineBot} from '../src/bot.ts';
class Memory implements StoragePort {data=new Map<string,string>();getItem(k:string){return this.data.get(k)??null;}setItem(k:string,v:string){this.data.set(k,v);}removeItem(k:string){this.data.delete(k);}}
function driveLesson(host:GameHost,choice=0){
 const s=host.screen(),l=s.lesson!;let c:Command;
 if(['continue','hand','notebook'].includes(l.kind))c={kind:'continue'};
 else if(l.kind==='bot')c={kind:'advance'};
 else if(l.kind==='choice')c={kind:'act',action:s.legalActions[choice]!};
 else if(l.kind==='action')c={kind:'act',action:s.expected!};
 else throw new Error('Finished');
 return host.dispatch(c,s.revision);
}
function restricted(s:Screen){
 const text=JSON.stringify(s);for(const key of ['"seed":','"archive":','"hands":','"solution":','"reasoning":'])assert.ok(!text.includes(key));
 for(const e of s.events)if(e.visibility==='private')assert.ok(e.recipients.includes(s.perspective));
 if(s.mode==='listen')assert.deepEqual(s.legalActions,[]);
 if(s.perspective==='public'){assert.deepEqual(s.hand,[]);assert.equal(s.notebook,null);assert.ok(s.events.every(e=>e.visibility==='public'));}
}
test('entire teaching route uses real legal actions, supports either reveal and never reveals future answers',()=>{
 for(const choice of [0,1]){
  const host=new GameHost('learn','ignored');let s=host.screen();
  assert.equal(s.phase.kind,'turn');assert.equal(s.events.some(e=>e.data.type==='evidenceRevealed'),false);
  assert.deepEqual([...s.hand].sort(),['method-a','suspect-a']);
  for(let i=0;i<lessons.length-1;i++){
   assert.equal(s.lesson!.title,lessons[i]!.title);restricted(s);
   if(s.lesson!.kind==='bot')assert.equal('action' in s.lesson!,false);
   if(s.lesson!.kind==='choice')assert.equal(s.legalActions.filter(a=>a.type==='reveal').length,2);
   if(s.lesson!.title==='When you cannot refute')assert.deepEqual(s.legalActions,[{type:'pass'}]);
   if(s.lesson!.title==='Assemble your answer')assert.equal(s.notebook!.entries.filter(e=>e.eliminatedFromSolution).length,6);
   s=driveLesson(host,choice);
  }
  assert.deepEqual(s.phase,{kind:'finished',winner:human});assert.equal(s.lesson!.kind,'finished');
  assert.ok(!s.events.some(e=>e.data.type==='evidenceRevealed'&&e.data.player==='investigator-b'&&e.data.recipient==='investigator-c'));
 }
});
test('practice rejects off-route choices without mutation; duplicate revisions cannot advance twice',()=>{
 const h=new GameHost('learn','ignored');const before=h.screen();h.dispatch({kind:'continue'},0);
 assert.throws(()=>h.dispatch({kind:'continue'},0),/already/);assert.equal(h.screen().revision,1);
 h.dispatch({kind:'continue'},1);const s=h.screen();
 assert.throws(()=>h.dispatch({kind:'act',action:{type:'move',destination:'location-c'}},s.revision),/practice/);
 assert.deepEqual(h.screen(),s);assert.notDeepEqual(before,s);
});
test('local restoration at every lesson position preserves exact progress without duplicate events',()=>{
 const storage=new Memory();let h=new GameHost('learn','ignored','public',storage);h.persist();
 for(let i=0;i<lessons.length;i++){
  const old=h.screen();h=GameHost.restore('learn',storage);assert.deepEqual(h.screen(),old);
  if(i<lessons.length-1)driveLesson(h,i%2);
 }
});
test('restore rejects damaged, oversized, mismatched and incompatible saves without replacing them',()=>{
 const m=new Memory(),h=new GameHost('learn','ignored','public',m);h.persist();const [key,value]=[...m.data][0]!;
 for(const bad of ['{',JSON.stringify({...JSON.parse(value),version:'future'}),JSON.stringify({...JSON.parse(value),seed:'bad'}),JSON.stringify({...JSON.parse(value),archive:{}}),'x'.repeat(2_000_001)]){
  m.setItem(key,bad);assert.throws(()=>GameHost.restore('learn',m));assert.equal(m.getItem(key),bad);
 }
});
test('unavailable storage leaves playable state and a readable warning',()=>{
 const bad:StoragePort={getItem(){throw Error();},setItem(){throw Error();},removeItem(){throw Error();}};
 const h=new GameHost('play','ordinary','public',bad);h.persist();assert.match(h.screen().storageWarning,/could not be saved/);
 assert.equal(GameHost.inspect('play',bad),'unavailable');assert.throws(()=>GameHost.restore('play',bad),/unavailable/);
});
test('ordinary play contains no tutorial and pauses at every human response; complete games restore',()=>{
 for(let i=0;i<8;i++){
  const storage=new Memory();const host=new GameHost('play',`normal-${i}`,'public',storage);let s=host.screen();let responses=0;
  for(let n=0;n<400&&s.phase.kind!=='finished';n++){
   assert.equal(s.lesson,null);assert.equal(s.expected,null);restricted(s);
   if(s.legalActions.length){
    if(s.phase.kind==='refutation'){
     responses++;assert.throws(()=>host.dispatch({kind:'advance'},s.revision),/human/);
    }
    // Test human stand-in is a policy consuming only the permitted view.
    const view={...s,player:human,rulesVersion:'headless-1',order:s.events.find(e=>e.data.type==='gameStarted')!.data};
    const event=s.events.find(e=>e.data.type==='gameStarted')!;
    assert.equal(event.data.type,'gameStarted');
    if(event.data.type!=='gameStarted')throw Error();
    const d=baselineBot({...view,order:event.data.order,notebook:s.notebook!});
    s=host.dispatch({kind:'act',action:d.action},s.revision);
   }else s=host.dispatch({kind:'advance'},s.revision);
   assert.deepEqual(GameHost.restore('play',storage).screen(),s);
  }
  assert.equal(s.phase.kind,'finished');assert.ok(responses>0);
 }
});
test('live public and followed observation contain only information at current action position',()=>{
 for(const perspective of ['public',...content.players] as const){
  const h=new GameHost('listen','observe',perspective as 'public'|'investigator-a');
  const r=new Referee(content,'observe');
  for(let i=0;i<40;i++){
   const s=h.screen();restricted(s);
   assert.deepEqual(s.events,perspective==='public'?r.publicLedger():r.followLedger(perspective));
   if(perspective!=='public')assert.deepEqual(s.notebook,r.view(perspective).notebook);
   if(s.phase.kind==='finished')break;
   h.dispatch({kind:'advance'},s.revision);r.stepBot(baselineBot);
  }
 }
});
test('failed human accusation retains response duty; history review has no mutation',()=>{
 const h=new GameHost('play','failure');let s=h.screen();
 while(!s.legalActions.some(a=>a.type==='accuse')){
  s=s.legalActions.length?h.dispatch({kind:'act',action:s.legalActions[0]!},s.revision):h.dispatch({kind:'advance'},s.revision);
 }
 const held=s.hand.find(c=>c.startsWith('suspect'));
 // Reference referee is test-only; production has no exposed debug API.
 const sol=new Referee(content,'failure').debugSnapshot().solution;
 const wrong={...sol,suspect:held??content.cards.suspect.find(c=>c!==sol.suspect)!};
 s=h.dispatch({kind:'act',action:{type:'accuse',hypothesis:wrong}},s.revision);
 assert.ok(s.investigators.find(p=>p.id===human)!.eliminated);
 const before=h.screen();for(let i=0;i<5;i++)assert.deepEqual(h.screen(),before);
 let replied=false;
 for(let i=0;i<300&&s.phase.kind!=='finished';i++){
  if(s.legalActions.length){assert.equal(s.phase.kind,'refutation');replied=true;s=h.dispatch({kind:'act',action:s.legalActions[0]!},s.revision);}
  else s=h.dispatch({kind:'advance'},s.revision);
 }
 assert.ok(replied);assert.equal(s.phase.kind,'finished');
});
