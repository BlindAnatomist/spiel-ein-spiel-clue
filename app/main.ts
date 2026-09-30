import { GameHost, type Mode, type Perspective, type Screen, type StoragePort, type Command } from './host.ts';
import { content, human, name, triple } from './content.ts';
import { narrate, situation } from './narration.ts';
import { categories, type Action, type Category, type Hypothesis } from '../src/types.ts';
const $=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id)! as T;
function el<K extends keyof HTMLElementTagNameMap>(tag:K,text?:string):HTMLElementTagNameMap[K]{const n=document.createElement(tag);if(text)n.textContent=text;return n;}
function button(text:string,run:()=>void,primary=false){const b=el('button',text);b.type='button';if(primary)b.className='primary';b.addEventListener('click',run);return b;}
function paragraph(parent:HTMLElement,text:string){parent.append(el('p',text));}
let storage:StoragePort|null=null;try{storage=window.localStorage;}catch{/* A readable warning is supplied by the host. */}
let host:GameHost|null=null, screen:Screen|null=null, reviewVisited=false;
const dialog=$<HTMLDialogElement>('panel');let returnTarget:HTMLElement|null=null;
function focus(id:string){$(id).focus();}
function openPanel(title:string,origin:HTMLElement=document.activeElement as HTMLElement){returnTarget=origin;$('panel-title').textContent=title;$('panel-body').replaceChildren();$('panel-close').textContent='Return to game';if(!dialog.open)dialog.showModal();focus('panel-title');return $('panel-body');}
function closePanel(){dialog.close();if(returnTarget?.isConnected&&!returnTarget.hidden)returnTarget.focus();else focus('action-title');}
$('panel-close').addEventListener('click',closePanel);
dialog.addEventListener('cancel',e=>{e.preventDefault();closePanel();});
function error(message:string){$('error').textContent=message;focus('error');}
function commit(command:Command,revision=screen!.revision){
 try{screen=host!.dispatch(command,revision);reviewVisited=false;render(true);}catch(e){error(e instanceof Error?e.message:'The action could not be completed.');}
}
function start(mode:Mode,perspective:Perspective='public',resume=false){
 try{
  host=resume?GameHost.restore(mode,storage!):new GameHost(mode,crypto.randomUUID(),perspective,storage);
  if(!resume)host.persist();screen=host.screen();reviewVisited=false;$('home').hidden=true;$('game').hidden=false;render(true);
 }catch(e){$('home-message').textContent=e instanceof Error?e.message:'Unable to open the case.';focus('home-message');}
}
function requestStart(mode:Mode,perspective:Perspective='public'){
 const state=GameHost.inspect(mode,storage);
 if(state!=='saved'){start(mode,perspective);return;}
 const body=openPanel('A saved case is available');paragraph(body,'Resume where you stopped, or explicitly replace the saved case. Starting a new case discards the previous progress in this mode only.');
 body.append(button('Resume saved case',()=>{closePanel();start(mode,perspective,true);},true),button('Start new case',()=>{
  const b=openPanel('Replace saved case?',returnTarget!);paragraph(b,'This will replace your saved progress in this mode. Other modes keep their own saves.');b.append(button('Replace and start',()=>{closePanel();start(mode,perspective);},true));$('panel-close').textContent='Cancel';
 }));$('panel-close').textContent='Cancel';
}
function home(){
 $('game').hidden=true;$('home').hidden=false;$('home-message').textContent='';
 const controls=$('entry-controls');controls.replaceChildren();
 controls.append(button('Learn to play',()=>requestStart('learn'),true),button('Play a game',()=>requestStart('play')));
 const label=el('label','Observation perspective');label.htmlFor='perspective';const select=el('select');select.id='perspective';
 for(const [value,text] of [['public','Public observation'],...content.players.map(p=>[p,`Follow ${name(p)}`])]){const o=el('option',text);o.value=value!;select.append(o);}
 controls.append(label,select,button('Listen to bots play',()=>requestStart('listen',select.value as Perspective)));
 const states=(['learn','play','listen'] as Mode[]).map(m=>GameHost.inspect(m,storage));
 if(states.includes('unavailable'))paragraph(controls,'Local resume is unavailable in this browser. You can play without it, but keep this page open.');
 focus('home-title');
}
$('menu').addEventListener('click',home);
$('explain').addEventListener('click',()=>{$('objective-text').tabIndex=-1;focus('objective-text');});
$('repeat').addEventListener('click',()=>{$('recent').tabIndex=-1;focus('recent');});
function render(moveFocus:boolean){
 const s=screen!;const phase=s.phase, isHumanTurn=phase.kind==='turn'&&phase.player===human;
 $('error').textContent='';
 $('mode-label').textContent=s.mode==='learn'?'Guided practice · You are Rowan':s.mode==='play'?'Fresh mystery · You are Rowan':s.perspective==='public'?'Listening · Public observation':`Listening · Follow ${name(s.perspective)}`;
 $('objective-title').textContent=s.lesson?.title??(phase.kind==='finished'?'Case complete':s.mode==='listen'?'Follow the investigation':'Current objective');
 $('objective-text').textContent=s.lesson?.text??(s.mode==='listen'?`Advance one action at a time. ${situation(phase,s.investigators)}`:`${situation(phase,s.investigators)} ${isHumanTurn?'Your goal is to identify one hidden suspect, method, and location. Use questions to gather evidence before accusing.':''}`);
 $('storage-warning').textContent=s.storageWarning;
 const recent=$('recent');recent.replaceChildren();for(const event of s.recent)paragraph(recent,narrate(event));
 $('evidence').hidden=s.perspective==='public';$('evidence').textContent=s.mode==='listen'?`${name(s.perspective)}’s evidence`:'My evidence';
 $('notebook').hidden=s.perspective==='public';
 $('action-title').textContent=phase.kind==='refutation'&&phase.responder===human&&s.mode!=='listen'?`Your response to ${name(phase.player)}`:'Your next action';
 const actions=$('actions');actions.replaceChildren();
 const rev=s.revision;
 if(s.lesson){
  const l=s.lesson;
  if(l.kind==='continue')actions.append(button('Continue',()=>commit({kind:'continue'},rev),true));
  else if(l.kind==='hand'||l.kind==='notebook'){
   actions.append(button(l.kind==='hand'?'Review my starting evidence':'Find Workshop in notebook',()=>openReview(l.kind==='hand'?'evidence':'notebook')));
   const next=button('Continue lesson',()=>commit({kind:'continue'},rev),true);next.disabled=!reviewVisited;next.id='lesson-continue';actions.append(next);
   paragraph(actions,'Read the requested evidence first, then return here to continue.');
  }else if(l.kind==='bot')actions.append(button('Next exchange',()=>commit({kind:'advance'},rev),true));
  else if(l.kind==='finished')actions.append(button('Choose a fresh game',home,true));
  else if(l.kind==='choice')responses(actions,s,rev);
  else if(s.expected){const a=s.expected;
   if(a.type==='suggest'||a.type==='accuse')actions.append(button(a.type==='suggest'?'Make a suggestion':'Make a final accusation',()=>composer(a.type),true));
   else actions.append(button(a.type==='move'?`Move to ${name(a.destination)}`:a.type==='endTurn'?'End turn':a.type==='pass'?'Cannot refute':'Show evidence',()=>commit({kind:'act',action:a},rev),true));
  }
 }else if(phase.kind==='finished')actions.append(button('Return to menu',home,true));
 else if(s.mode==='listen'||(!s.legalActions.length)){
  actions.append(button('Next exchange',()=>commit({kind:'advance'},rev),true));
  if(s.investigators.find(p=>p.id===human)?.eliminated&&s.mode==='play')paragraph(actions,'You lost active turns after an incorrect accusation. Continue following the case. It will still pause whenever you must answer a suggestion.');
 }else if(phase.kind==='refutation')responses(actions,s,rev);
 else{
  for(const a of s.legalActions)if(a.type==='move')actions.append(button(`Move to ${name(a.destination)}`,()=>commit({kind:'act',action:a},rev)));
  if(s.legalActions.some(a=>a.type==='suggest'))actions.append(button('Make a suggestion',()=>composer('suggest'),true));
  actions.append(button('End turn',()=>commit({kind:'act',action:{type:'endTurn'}},rev)));
  if(s.legalActions.some(a=>a.type==='accuse'))actions.append(button('Make a final accusation',()=>composer('accuse')));
 }
 if(moveFocus){
  if(s.lesson)focus('objective-title');
  else if(phase.kind==='finished')focus('objective-title');
  else if(phase.kind==='refutation'&&phase.responder===human&&s.mode==='play')focus('action-title');
  else {recent.tabIndex=-1;recent.focus();}
 }
}
function responses(parent:HTMLElement,s:Screen,rev:number){
 if(s.phase.kind!=='refutation')return;
 paragraph(parent,`${name(s.phase.player)} asks: ${triple(s.phase.hypothesis)}. Show one matching card privately to ${name(s.phase.player)}, or choose Cannot refute if none match.`);
 for(const a of s.legalActions){if(a.type==='reveal')parent.append(button(`Show ${name(a.card)}`,()=>commit({kind:'act',action:a},rev),true));if(a.type==='pass')parent.append(button('Cannot refute',()=>commit({kind:'act',action:a},rev),true));}
}
function composer(type:'suggest'|'accuse'){
 const s=screen!,rev=s.revision,origin=document.activeElement as HTMLElement;
 const selected:Partial<Hypothesis>={};
 if(type==='suggest')selected.location=s.investigators.find(p=>p.id===human)!.location;
 const draw=()=>{
  const body=openPanel(type==='suggest'?'Build a suggestion':'Build a final accusation',origin);
  if(s.lesson)paragraph(body,`Current objective: ${s.lesson.text}`);
  paragraph(body,type==='suggest'?'This question can reveal evidence. It does not commit you to an answer.':'An incorrect accusation ends your active turns. You will still have to answer other investigators. You will review the exact answer before confirming.');
  for(const category of categories){
   if(type==='suggest'&&category==='location'){paragraph(body,`Location: ${name(selected.location!)}. Suggestions use your current location.`);continue;}
   const label=el('label',category[0]!.toUpperCase()+category.slice(1));label.htmlFor=`choose-${category}`;
   const select=el('select');select.id=label.htmlFor;const blank=el('option',`Choose ${category}`);blank.value='';select.append(blank);
   for(const card of s.content.cards[category]){const o=el('option',name(card));o.value=card;select.append(o);}
   select.value=selected[category]??'';select.addEventListener('change',()=>{selected[category]=select.value;});body.append(label,select);
  }
  const problem=el('p');problem.tabIndex=-1;
  body.append(problem,button(type==='suggest'?'Review suggestion':'Review accusation',()=>{
   if(!categories.every(c=>selected[c])){problem.textContent='Choose an item in every selector before reviewing.';problem.focus();return;}
   const action={type,hypothesis:{suspect:selected.suspect!,method:selected.method!,location:selected.location!}} as Action;
   if(s.expected&&JSON.stringify(action)!==JSON.stringify(s.expected)){
    problem.textContent='Use the choices named in the current practice objective. Nothing has been submitted.';problem.focus();return;
   }
   const review=openPanel(type==='suggest'?'Review your suggestion':'Confirm final accusation',origin);
   paragraph(review,triple(selected as Hypothesis));
   paragraph(review,type==='suggest'?'Ask this question now? Investigators will respond in order.':'Confirming attempts to win. If any part is wrong, you lose active turns but must still answer refutations.');
   review.append(button(type==='suggest'?'Submit suggestion':'Confirm accusation',()=>{dialog.close();commit({kind:'act',action},rev);},true),button('Change choices',draw));
   $('panel-close').textContent=type==='suggest'?'Cancel suggestion':'Cancel accusation';
  },true));
  $('panel-close').textContent=type==='suggest'?'Cancel suggestion':'Cancel accusation';
 };
 draw();
}
function acknowledgeReview(card?:string){
 const l=screen!.lesson;
 if(l?.kind==='hand'||(l?.kind==='notebook'&&l.card===card)){
  reviewVisited=true;const b=document.getElementById('lesson-continue') as HTMLButtonElement|null;if(b)b.disabled=false;
 }
}
function openReview(kind:'situation'|'evidence'|'notebook'|'transcript'|'rules'){
 const s=screen!;const titles={situation:'Current situation',evidence:s.mode==='listen'?`${name(s.perspective)}’s evidence`:'My evidence',notebook:'Evidence notebook',transcript:'Case transcript',rules:'Rules help'};
 const body=openPanel(titles[kind]);
 if(s.lesson)paragraph(body,`Current objective: ${s.lesson.title}. ${s.lesson.text}`);
 if(kind==='situation'){
  paragraph(body,situation(s.phase,s.investigators));
  for(const p of s.investigators)paragraph(body,`${name(p.id)}: ${name(p.location)}; ${p.handCount} evidence cards.${p.eliminated?' No active turns; still answers refutations.':''}`);
  if(s.perspective!=='public'){const at=s.investigators.find(p=>p.id===s.perspective)!.location;paragraph(body,`Connected destinations from ${name(at)}: ${s.content.routes.filter(r=>r.from===at).map(r=>name(r.to)).join(', ')}.`);}
 }else if(kind==='evidence'){
  paragraph(body,'Personally held cards are not in the hidden answer. Investigator names identify who holds evidence; suspect cards identify people being investigated.');
  const list=el('ul');for(const card of s.hand)list.append(el('li',`${name(card)}. Personally held; excluded from the hidden answer.`));body.append(list);
  const shown=s.notebook?.entries.filter(e=>e.status==='directlyRevealed')??[];body.append(el('h3','Evidence shown privately'));
  if(!shown.length)paragraph(body,'No cards have been shown to you yet.');
  for(const e of shown)paragraph(body,`${name(e.card)}. Shown by ${[...new Set(e.reveals.map(r=>name(r.by)))].join(', ')}.`);
  acknowledgeReview();
 }else if(kind==='notebook'){
  paragraph(body,'Unresolved means this notebook has not directly eliminated the item. It does not guarantee that the item is still logically possible. Recorded evidence is kept separate from deductions you make yourself.');
  const label=el('label','Evidence category');label.htmlFor='category';const select=el('select');select.id='category';
  for(const [value,text] of [['suspect','Suspects'],['method','Methods'],['location','Locations']]){const o=el('option',text);o.value=value!;select.append(o);}body.append(label,select);
  const entries=el('div');body.append(entries);
  const draw=()=>{entries.replaceChildren();for(const e of s.notebook?.entries.filter(e=>e.category===select.value)??[]){
   entries.append(button(`${name(e.card)} — ${e.status==='personallyHeld'?'personally held':e.status==='directlyRevealed'?'shown privately':'unresolved'}`,()=>{
    const old=entries.querySelector('[data-detail]');old?.remove();const detail=el('section');detail.dataset.detail='true';detail.tabIndex=-1;
    paragraph(detail,`${name(e.card)}. ${e.status==='personallyHeld'?'You hold this card. It cannot be hidden.':e.status==='directlyRevealed'?'Direct evidence: this card cannot be hidden.':'Unresolved: not directly eliminated by a held or shown card.'}`);
    for(const r of e.reveals)paragraph(detail,`Shown by ${name(r.by)}. Transcript reference ${r.eventId}.`);
    if(!e.reveals.length&&e.status==='unresolved')paragraph(detail,'No direct reveal is recorded. Review public exchanges for constraints you can reason from.');
    entries.append(detail);acknowledgeReview(e.card);detail.focus();
   }));}
  };select.addEventListener('change',draw);draw();
 }else if(kind==='transcript'){
  paragraph(body,'Only information available in your current perspective appears here. References connect notebook entries to the transcript. Reading history does not advance the case.');
  const label=el('label','History range');label.htmlFor='history-range';const select=el('select');select.id='history-range';
  for(const [v,t] of [['recent','Recent exchanges'],['all','Earlier and recent history']]){const o=el('option',t);o.value=v!;select.append(o);}body.append(label,select);
  const list=el('ol');body.append(list);const draw=()=>{list.replaceChildren();const events=select.value==='all'?s.events:s.events.slice(-15);for(const e of events)list.append(el('li',`Reference ${e.id}. ${narrate(e)}`));};select.addEventListener('change',draw);draw();
 }else{
  const rules:[string,string][]=[
   ['Objective and evidence','One suspect, one method, and one location form the hidden answer. All other cards are held by investigators. Holding or seeing a card excludes it from the hidden answer. Investigators and suspects are different people.'],
   ['Movement and suggestions','You may move once along a listed connection before suggesting. Movement is optional. A suggestion uses your current location and asks about one suspect and method. It is a question, not an accusation.'],
   ['Answering a question','Other investigators are asked in order. A matching card must be shown privately to the asker. With several matches, choose exactly one. With none, Cannot refute is the only legal response. The first reveal stops the process. Investigators not reached have not passed.'],
   ['Reasoning from passes','If you hold two suggested cards, do not hold the third, and every other investigator passes, the third is hidden. More generally, an all-pass question can still contain cards in the asker’s own hand. Do not assume all three are hidden.'],
   ['Final accusation','You may accuse on your turn, before or after a question, but not during pending refutation. The accusation may name any location. Review and confirmation are required. Correct wins; incorrect ends active turns but you still answer refutations. If everybody fails, no one wins.'],
   ['Notebook and pacing','Unresolved means not directly eliminated, not guaranteed possible after all deductions. Next exchange advances one action only. Help, review, repeat, and cancel never run bots or change the rules state. No timer advances play.'],
   ['Local resume','Practice, ordinary play, and observation each keep one local save on this browser when storage is available. Return to menu and choose the same mode to resume. Saves stay on this device. Starting new explicitly replaces that mode’s save.'],
  ];
  for(const [title,text] of rules){const d=el('details');d.append(el('summary',title),el('p',text));body.append(d);}
 }
}
for(const kind of ['situation','evidence','notebook','transcript','rules'] as const)$(kind).addEventListener('click',()=>openReview(kind));
home();
