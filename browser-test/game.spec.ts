import {test,expect,type Page} from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import {lessons} from '../app/tutorial.ts';
import {content,human,name} from '../app/content.ts';
import {Referee} from '../src/referee.ts';
import {baselineBot} from '../src/bot.ts';
import {narrate} from '../app/narration.ts';
import type {Action} from '../src/types.ts';
const saved=async(page:Page,mode='learn')=>page.evaluate(m=>localStorage.getItem(`deduction-browser-2-${m}`),mode);
async function clean(page:Page,seed='browser-normal'){
 await page.addInitScript(seed=>{Object.defineProperty(crypto,'randomUUID',{value:()=>seed});},seed);
 await page.goto('/');
}
async function act(page:Page,action:Action){
 if(action.type==='suggest'||action.type==='accuse'){
  await page.getByRole('button',{name:action.type==='suggest'?'Make a suggestion':'Make a final accusation',exact:true}).click();
  await page.getByLabel('Suspect',{exact:true}).selectOption(action.hypothesis.suspect);
  await page.getByLabel('Method',{exact:true}).selectOption(action.hypothesis.method);
  if(action.type==='accuse')await page.getByLabel('Location',{exact:true}).selectOption(action.hypothesis.location);
  await page.getByRole('button',{name:action.type==='suggest'?'Review suggestion':'Review accusation',exact:true}).click();
  await page.getByRole('button',{name:action.type==='suggest'?'Submit suggestion':'Confirm accusation',exact:true}).click();
 }else{
  const label=action.type==='move'?`Move to ${name(action.destination)}`:action.type==='reveal'?`Show ${name(action.card)}`:action.type==='pass'?'Cannot refute':'End turn';
  await page.getByRole('button',{name:label,exact:true}).click();
 }
}
for(const choice of [0,1])test(`complete guided game, reveal choice ${choice+1}, restoration and recorded evidence`,async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await clean(page);
 await page.getByRole('button',{name:'Learn to play',exact:true}).click();
 for(let i=0;i<lessons.length-1;i++){
  const l=lessons[i]!;await expect(page.locator('#objective-title')).toHaveText(l.title);
  await expect(page.locator('#objective-title')).toBeFocused();
  if(i===8){
   const before=await saved(page);await page.reload();await page.getByRole('button',{name:'Learn to play',exact:true}).click();await page.getByRole('button',{name:'Resume saved case'}).click();
   expect(await saved(page)).toBe(before);await expect(page.locator('#objective-title')).toHaveText(l.title);
  }
  if(l.kind==='continue')await page.getByRole('button',{name:'Continue',exact:true}).click();
  else if(l.kind==='hand'){
   await expect(page.getByRole('button',{name:'Continue lesson'})).toBeDisabled();
   await page.getByRole('button',{name:'Review my starting evidence'}).click();
   await expect(page.getByRole('dialog')).toContainText('Mira. Personally held');
   await expect(page.getByRole('dialog')).toContainText('Copied key. Personally held');
   await page.getByRole('button',{name:'Return to game',exact:true}).click();
   await expect(page.getByRole('button',{name:'Review my starting evidence'})).toBeFocused();
   await page.getByRole('button',{name:'Continue lesson'}).click();
  }else if(l.kind==='notebook'){
   await expect(page.getByRole('button',{name:'Continue lesson'})).toBeDisabled();
   await page.getByRole('button',{name:'Find Workshop in notebook'}).click();
   await page.getByLabel('Evidence category').selectOption('location');
   await page.getByRole('button',{name:'Workshop — shown privately',exact:true}).click();
   await expect(page.getByRole('dialog')).toContainText('Shown by Lena.');
   await page.getByRole('button',{name:'Return to game',exact:true}).click();await page.getByRole('button',{name:'Continue lesson'}).click();
  }else if(l.kind==='bot')await page.getByRole('button',{name:'Next exchange',exact:true}).click();
  else if(l.kind==='choice'){
   const options=page.locator('#actions button');await expect(options).toHaveCount(2);await options.nth(choice).click();
  }else if(l.kind==='action')await act(page,l.action!);
 }
 await expect(page.locator('#objective-title')).toHaveText('Practice complete');
 await expect(page.locator('#recent')).toContainText('Rowan solved the case');
 expect(errors).toEqual([]);
});

test('help, repeats, review, selectors and canceled accusations preserve state and focus',async({page})=>{
 await clean(page,'ordinary-controls');await page.getByRole('button',{name:'Play a game',exact:true}).click();
 for(let i=0;i<100&&!await page.getByRole('button',{name:'Make a final accusation',exact:true}).isVisible();i++){
  const next=page.getByRole('button',{name:'Next exchange',exact:true});if(await next.isVisible())await next.click();else await page.locator('#actions button').first().click();
 }
 const before=await saved(page,'play');
 for(const id of ['situation','evidence','notebook','transcript','rules']){
  await page.locator('#'+id).click();await expect(page.locator('#panel-title')).toBeFocused();await page.keyboard.press('Escape');await expect(page.locator('#'+id)).toBeFocused();expect(await saved(page,'play')).toBe(before);
 }
 await page.getByRole('button',{name:'Explain this step'}).click();await expect(page.locator('#objective-text')).toBeFocused();
 await page.getByRole('button',{name:'Repeat last exchange'}).click();await expect(page.locator('#recent')).toBeFocused();
 await page.getByRole('button',{name:'Make a final accusation',exact:true}).click();
 await page.getByLabel('Suspect',{exact:true}).selectOption('suspect-a');await page.getByLabel('Method',{exact:true}).selectOption('method-a');await page.getByLabel('Location',{exact:true}).selectOption('location-a');
 expect(await saved(page,'play')).toBe(before);
 await page.getByRole('button',{name:'Review accusation',exact:true}).click();await expect(page.locator('#panel-title')).toHaveText('Confirm final accusation');expect(await saved(page,'play')).toBe(before);
 await page.getByRole('button',{name:'Cancel accusation',exact:true}).click();await expect(page.getByRole('button',{name:'Make a final accusation',exact:true})).toBeFocused();expect(await saved(page,'play')).toBe(before);
});

test('ordinary game is independent of tutorial, stops for human choices, and reaches completion',async({page})=>{
 const seed='ordinary-complete';await clean(page,seed);await page.getByRole('button',{name:'Play a game',exact:true}).click();
 const ref=new Referee(content,seed);let interrupted=0;
 for(let n=0;n<300;n++){
  const v=ref.view(human);if(v.phase.kind==='finished')break;
  expect(await page.locator('#mode-label').textContent()).toContain('Fresh mystery');
  if(v.legalActions.length){
   if(v.phase.kind==='refutation'){interrupted++;await expect(page.getByRole('button',{name:'Next exchange',exact:true})).toHaveCount(0);}
   const d=baselineBot(v);await act(page,d.action);ref.submit(human,d.action);
  }else{await page.getByRole('button',{name:'Next exchange',exact:true}).click();ref.stepBot(baselineBot);}
 }
 await expect(page.locator('#objective-title')).toHaveText('Case complete');expect(interrupted).toBeGreaterThan(0);
});

test('wrong accusation ends active turns but still prompts for refutation',async({page})=>{
 const seed='failure';await clean(page,seed);await page.getByRole('button',{name:'Play a game',exact:true}).click();const r=new Referee(content,seed);
 for(let i=0;i<100&&!r.view(human).legalActions.some(a=>a.type==='accuse');i++){
  const v=r.view(human);if(v.legalActions.length){await act(page,v.legalActions[0]!);r.submit(human,v.legalActions[0]!);}else{await page.getByRole('button',{name:'Next exchange',exact:true}).click();r.stepBot(baselineBot);}
 }
 const sol=r.debugSnapshot().solution;const wrong={...sol,suspect:content.cards.suspect.find(s=>s!==sol.suspect)!};await act(page,{type:'accuse',hypothesis:wrong});r.submit(human,{type:'accuse',hypothesis:wrong});await expect(page.locator('#recent')).toContainText('Incorrect');
 let answered=false;
 for(let i=0;i<100&&r.view(human).phase.kind!=='finished';i++){
  const v=r.view(human);if(v.legalActions.length){answered=true;await expect(page.locator('#action-title')).toContainText('Your response');await act(page,v.legalActions[0]!);r.submit(human,v.legalActions[0]!);}else{await page.getByRole('button',{name:'Next exchange',exact:true}).click();r.stepBot(baselineBot);}
 }
 expect(answered).toBe(true);await expect(page.locator('#objective-title')).toHaveText('Case complete');
});

for(const perspective of ['public','investigator-b'])test(`observation ${perspective} only renders current authorized events`,async({page})=>{
 const seed='observe-browser';await clean(page,seed);await page.getByLabel('Observation perspective').selectOption(perspective);await page.getByRole('button',{name:'Listen to bots play',exact:true}).click();const r=new Referee(content,seed);
 for(let n=0;n<35;n++){
  await page.getByRole('button',{name:'Transcript',exact:true}).click();await page.getByLabel('History range').selectOption('all');
  const visible=perspective==='public'?r.publicLedger():r.followLedger(perspective);
  const lines=await page.locator('#panel-body li').allTextContents();expect(lines).toEqual(visible.map(e=>`Reference ${e.id}. ${narrate(e)}`));
  await page.getByRole('button',{name:'Return to game',exact:true}).click();
  if(perspective==='public'){await expect(page.locator('#notebook')).toBeHidden();await expect(page.locator('#evidence')).toBeHidden();}
  const before=await saved(page,'listen');await page.getByRole('button',{name:'Repeat last exchange'}).click();expect(await saved(page,'listen')).toBe(before);
  if(r.view(human).phase.kind==='finished')break;
  await page.getByRole('button',{name:'Next exchange',exact:true}).click();r.stepBot(baselineBot);
 }
});

test('storage failures and damaged saves offer explicit recovery',async({page})=>{
 await clean(page);await page.evaluate(()=>localStorage.setItem('deduction-browser-2-learn','broken'));
 await page.getByRole('button',{name:'Learn to play',exact:true}).click();await page.getByRole('button',{name:'Resume saved case'}).click();await expect(page.locator('#home-message')).toContainText('damaged');expect(await saved(page)).toBe('broken');
 await page.getByRole('button',{name:'Learn to play',exact:true}).click();await page.getByRole('button',{name:'Start new case',exact:true}).click();await page.getByRole('button',{name:'Replace and start'}).click();await expect(page.locator('#objective-title')).toHaveText('The missing dispatch');
});

test('semantic controls, accessible names, keyboard dialogs and mobile reflow',async({page})=>{
 await clean(page);expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
 await page.getByRole('button',{name:'Learn to play',exact:true}).focus();await page.keyboard.press('Enter');await expect(page.locator('#objective-title')).toBeFocused();
 await page.getByRole('button',{name:'Rules help',exact:true}).focus();await page.keyboard.press('Enter');await expect(page.locator('#panel-title')).toBeFocused();
 expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
 await page.keyboard.press('Tab');expect(await page.evaluate(()=>document.activeElement?.tagName)).toBe('SUMMARY');await page.keyboard.press('Enter');
 await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'Rules help',exact:true})).toBeFocused();
 await page.evaluate(()=>document.documentElement.style.fontSize='36px');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await page.evaluate(()=>document.documentElement.style.fontSize='18px');
 await page.getByRole('button',{name:'Continue',exact:true}).click();await page.getByRole('button',{name:'Review my starting evidence'}).click();await page.getByRole('button',{name:'Return to game',exact:true}).click();await page.getByRole('button',{name:'Continue lesson'}).click();await page.getByRole('button',{name:'Move to Workshop'}).click();await page.getByRole('button',{name:'Continue',exact:true}).click();await page.getByRole('button',{name:'Make a suggestion',exact:true}).click();
 expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
 await expect(page.getByLabel('Suspect',{exact:true})).toHaveAttribute('id','choose-suspect');await expect(page.getByLabel('Method',{exact:true})).toHaveAttribute('id','choose-method');
});
