// Trusted application host. Referee, seeds, future lessons and saved archives stay here.
import { Referee, RULES_VERSION, type ReplayArchive } from '../src/referee.ts';
import { baselineBot } from '../src/bot.ts';
import { frozenCopy } from '../src/util.ts';
import type { Action, Content, Investigator, Notebook, PublicPhase, VisibleEvent } from '../src/types.ts';
import { content, human } from './content.ts';
import { lessons, PRACTICE_SEED, type Lesson } from './tutorial.ts';
export type Mode = 'learn' | 'play' | 'listen';
export type Perspective = 'public' | 'investigator-a' | 'investigator-b' | 'investigator-c';
export interface StoragePort { getItem(key:string):string|null; setItem(key:string,value:string):void; removeItem(key:string):void }
export type Command = {kind:'continue'} | {kind:'advance'} | {kind:'act';action:Action};
export interface Screen {
 mode:Mode; perspective:Perspective; revision:number; content:Content; phase:PublicPhase; investigators:Investigator[];
 turn:number; hand:string[]; notebook:Notebook|null; events:VisibleEvent[]; recent:VisibleEvent[]; legalActions:Action[];
 lesson:Pick<Lesson,'title'|'text'|'kind'|'card'>|null; expected:Action|null; storageWarning:string;
}
const SAVE_VERSION='browser-2';
const key=(mode:Mode)=>`deduction-${SAVE_VERSION}-${mode}`;
function validMode(v:unknown):v is Mode{return v==='learn'||v==='play'||v==='listen';}
function validPerspective(v:unknown):v is Perspective{return v==='public'||content.players.includes(v as string);}
function equal(a:unknown,b:unknown){return JSON.stringify(a)===JSON.stringify(b);}
export class GameHost {
 #referee:Referee; #mode:Mode; #perspective:Perspective; #seed:string; #journal:Command[]=[]; #lesson=0;
 #recent:VisibleEvent[]=[]; #storage:StoragePort|null; #warning='';
 constructor(mode:Mode, seed:string, perspective:Perspective='public', storage:StoragePort|null=null){
  if(!validMode(mode)||!validPerspective(perspective)||typeof seed!=='string'||seed.length<1||seed.length>200)throw new Error('Invalid case configuration');
  this.#mode=mode;this.#perspective=mode==='listen'?perspective:human;this.#seed=mode==='learn'?PRACTICE_SEED:seed;
  this.#storage=storage;this.#referee=new Referee(content,this.#seed);this.#recent=this.#events();
  if(!storage)this.#warning='Local saving is unavailable. This case works while this page stays open; reloading may lose progress.';
 }
 #events():VisibleEvent[]{return this.#perspective==='public'?this.#referee.publicLedger():this.#referee.followLedger(this.#perspective);}
 screen():Screen{
  const base=this.#referee.view(this.#perspective==='public'?human:this.#perspective);
  const events=this.#events();
  const lesson=this.#mode==='learn'?lessons[this.#lesson]!:null;
  return frozenCopy({mode:this.#mode,perspective:this.#perspective,revision:this.#journal.length,
   content:base.content,phase:base.phase,investigators:base.investigators,turn:base.turn,
   hand:this.#perspective==='public'?[]:base.hand,notebook:this.#perspective==='public'?null:base.notebook,
   events,recent:this.#recent,legalActions:this.#mode==='listen'?[]:base.legalActions,
   lesson:lesson?{title:lesson.title,text:lesson.text,kind:lesson.kind,...(lesson.card?{card:lesson.card}:{})}:null,
   expected:lesson?.kind==='action'?lesson.action!:null,storageWarning:this.#warning});
 }
 dispatch(command:Command, expectedRevision:number, save=true):Screen {
  if(expectedRevision!==this.#journal.length)throw new Error('That action has already been handled. Review the current situation.');
  if(!command||typeof command!=='object'||!['continue','advance','act'].includes(command.kind))throw new Error('Invalid command');
  if(Object.keys(command).sort().join(',')!==(command.kind==='act'?'action,kind':'kind'))throw new Error('Invalid command fields');
  const step=structuredClone(command);
  const before=this.#events().at(-1)?.id??-1;
  const view=this.#referee.view(human), phase=view.phase;
  const actor=phase.kind==='finished'?null:phase.kind==='turn'?phase.player:phase.responder;
  if(this.#mode==='learn'){
   const lesson=lessons[this.#lesson]!;
   if(command.kind==='continue'&&['continue','hand','notebook'].includes(lesson.kind))this.#lesson++;
   else if(command.kind==='advance'&&lesson.kind==='bot'&&actor!==human&&actor){this.#referee.submit(actor,lesson.action!);this.#lesson++;}
   else if(command.kind==='act'&&actor===human&&(lesson.kind==='choice'||lesson.kind==='action')){
    if(lesson.kind==='action'&&!equal(command.action,lesson.action))throw new Error('For this practice step, use the choices named in the current objective. Your game has not changed.');
    if(lesson.kind==='choice'&&command.action.type!=='reveal')throw new Error('Choose one matching card to reveal.');
    this.#referee.submit(human,command.action);this.#lesson++;
   }else throw new Error('Use the action described in the current practice objective.');
  }else if(command.kind==='act'&&this.#mode==='play'&&actor===human){this.#referee.submit(human,command.action);}
  else if(command.kind==='advance'&&actor&&(this.#mode==='listen'||actor!==human)){this.#referee.stepBot(baselineBot);}
  else throw new Error('The next decision belongs to the human, or the case has ended.');
  this.#journal.push(step);
  const fresh=this.#events().filter(e=>e.id>before);
  if(fresh.length)this.#recent=fresh;
  if(save)this.persist();
  return this.screen();
 }
 persist():void{
  if(!this.#storage)return;
  try{this.#storage.setItem(key(this.#mode),JSON.stringify({version:SAVE_VERSION,rulesVersion:RULES_VERSION,mode:this.#mode,perspective:this.#perspective,seed:this.#seed,journal:this.#journal,archive:this.#referee.archive()}));this.#warning='';}
  catch{this.#warning='Progress could not be saved on this device. You can keep playing, but reloading may lose recent progress.';}
 }
 static inspect(mode:Mode,storage:StoragePort|null):'none'|'saved'|'unavailable'{
  if(!storage)return 'unavailable';try{return storage.getItem(key(mode))?'saved':'none';}catch{return 'unavailable';}
 }
 static restore(mode:Mode,storage:StoragePort):GameHost{
  let raw:string|null;try{raw=storage.getItem(key(mode));}catch{throw new Error('Local storage is unavailable. Start a new case to play without resume.');}
  if(!raw)throw new Error('There is no saved case in this mode.');
  if(raw.length>2_000_000)throw new Error('Saved case is too large or damaged. Start a new case explicitly.');
  try{
   const saved=JSON.parse(raw) as {version:string;rulesVersion:string;mode:Mode;perspective:Perspective;seed:string;journal:Command[];archive:ReplayArchive};
   if(saved.version!==SAVE_VERSION||saved.rulesVersion!==RULES_VERSION)throw new Error('version');
   if(saved.mode!==mode||!validPerspective(saved.perspective)||!Array.isArray(saved.journal)||saved.journal.length>1500)throw new Error('shape');
   if(mode==='learn'&&saved.seed!==PRACTICE_SEED)throw new Error('fixture');
   const host=new GameHost(mode,saved.seed,saved.perspective,storage);
   for(const c of saved.journal)host.dispatch(c,host.#journal.length,false);
   if(!equal(saved.archive,host.#referee.archive()))throw new Error('archive');
   return host;
  }catch{throw new Error('This saved case is damaged or belongs to an incompatible version. It has not been changed. Choose Start new case if you want to replace it.');}
 }
}
