import {test,expect,type Page} from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import {lessons} from '../app/tutorial.ts';
import {content,human,name} from '../app/content.ts';
import {Referee} from '../src/referee.ts';
import {baselineBot} from '../src/bot.ts';
import {narrate} from '../app/narration.ts';
import {GameHost,type Mode,type Perspective} from '../app/host.ts';
import type {Action} from '../src/types.ts';
const saved=async(page:Page,mode='learn')=>page.evaluate(m=>localStorage.getItem(`deduction-browser-2-${m}`),mode);

for(const [mode,perspective] of [
 ['listen','investigator-a'],['listen','investigator-b'],['listen','investigator-c'],
 ['learn','investigator-a'],['play','investigator-a'],
] as [Mode,Perspective][])test(`evidence ownership wording for ${mode} ${perspective}`,async({page})=>{
 const seed='evidence-ownership-browser';await clean(page,seed);
 if(mode==='listen')await page.getByLabel('Observation perspective').selectOption(perspective);
 await page.getByRole('button',{name:mode==='listen'?'Listen to bots play':mode==='learn'?'Learn to play':'Play a game',exact:true}).click();
 const initial=new GameHost(mode,seed,perspective).screen();
 const before=await saved(page,mode);
 await page.locator('#evidence').click();
 await expect(page.getByRole('dialog')).toContainText(mode==='listen'?`No cards have been shown to ${name(perspective)} yet.`:'No cards have been shown to you yet.');
 await page.getByRole('button',{name:'Return to game',exact:true}).click();
 await page.locator('#notebook').click();
 const card=initial.hand[0]!;
 await page.getByLabel('Evidence category').selectOption(card.split('-')[0]!);
 await page.getByRole('button',{name:`${name(card)} — personally held`,exact:true}).click();
  await expect(page.locator('[data-detail] p').first()).toHaveText(`${name(card)}. ${mode==='listen'?`${name(perspective)} holds`:'You hold'} this card. It cannot be hidden.`);
 expect(await saved(page,mode)).toBe(before);
 await page.getByRole('button',{name:'Return to game',exact:true}).click();
 await expect(page.locator('#notebook')).toBeFocused();
});
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
  await expect(page.locator('#actions button:not(:disabled)').first()).toBeFocused();
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
  }else if(l.kind==='bot'){
   const next=await page.getByRole('button',{name:'Next exchange',exact:true}).elementHandle();await next!.click();
   if(lessons[i+1]!.kind==='bot')expect(await next!.evaluate(node=>node===document.querySelector('#actions button'))).toBe(true);
  }
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
 await page.getByRole('button',{name:'Explain this step'}).click();await expect(page.locator('#panel-title')).toBeFocused();await page.keyboard.press('Escape');await expect(page.locator('#explain')).toBeFocused();
 await page.getByRole('button',{name:'Repeat this step'}).click();await expect(page.locator('#step-readback')).toBeFocused();
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
  const before=await saved(page,'listen');await page.getByRole('button',{name:'Repeat this step'}).click();expect(await saved(page,'listen')).toBe(before);
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
 await page.getByRole('button',{name:'Learn to play',exact:true}).focus();await page.keyboard.press('Enter');await expect(page.getByRole('button',{name:'Continue',exact:true})).toBeFocused();
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

test('complete step narration is atomic, ordered and repeatable without advancing play',async({page})=>{
 await clean(page);const status=page.locator('#announcement');
 await expect(status).toHaveAttribute('role','status');await expect(status).toHaveAttribute('aria-live','polite');await expect(status).toHaveAttribute('aria-atomic','true');
 await page.getByRole('button',{name:'Learn to play',exact:true}).click();await expect(status).toContainText('The missing dispatch');
 await expect(page.getByRole('button',{name:'Continue',exact:true})).toBeFocused();
 await page.getByRole('button',{name:'Continue',exact:true}).click();await expect(status).toContainText('Review your starting evidence');await expect(status).not.toContainText('Case opened.');
 await page.getByRole('button',{name:'Review my starting evidence',exact:true}).click();await page.getByRole('button',{name:'Return to game',exact:true}).click();
 await page.getByRole('button',{name:'Continue lesson',exact:true}).click();await page.getByRole('button',{name:'Move to Workshop',exact:true}).click();
 await page.getByRole('button',{name:'Continue',exact:true}).click();await act(page,{type:'suggest',hypothesis:{suspect:'suspect-a',method:'method-a',location:'location-b'}});
 await expect(status).toContainText('Choose Next exchange');
 await page.evaluate(()=>{
  const updates:string[]=[];Object.defineProperty(window,'narrationUpdates',{value:updates,configurable:true});
  const target=document.querySelector('#announcement')!;
  new MutationObserver(()=>{if(target.textContent)updates.push(target.textContent);}).observe(target,{childList:true,characterData:true,subtree:true});
 });
 await page.getByRole('button',{name:'Next exchange',exact:true}).click();await expect(status).toContainText('Private evidence. Lena showed Rowan: Workshop.');
 const text=(await status.textContent())!;
 expect(text.indexOf('Lena refuted')).toBeLessThan(text.indexOf('Private evidence.'));
 expect(text.indexOf('Private evidence.')).toBeLessThan(text.indexOf('The question is complete.'));
 expect(await page.evaluate(()=>(window as unknown as {narrationUpdates:string[]}).narrationUpdates)).toEqual([text]);
 await expect(page.getByRole('button',{name:'Find Workshop in notebook',exact:true})).toBeFocused();
 const before=await saved(page);await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));expect(await saved(page)).toBe(before);
 await page.getByRole('button',{name:'Repeat this step',exact:true}).click();await expect(page.locator('#step-readback')).toBeFocused();await expect(page.locator('#step-readback')).toHaveText(text);await expect(status).toBeEmpty();expect(await saved(page)).toBe(before);
 await page.evaluate(()=>{
  const readback=document.querySelector<HTMLElement>('#step-readback')!;readback.dataset.focusEvents='0';
  readback.addEventListener('focus',()=>{readback.dataset.focusEvents=String(Number(readback.dataset.focusEvents)+1);});
  document.querySelector<HTMLButtonElement>('#repeat')!.click();
 });
 await expect(page.locator('#step-readback')).toHaveAttribute('data-focus-events','1');await expect(page.locator('#step-readback')).toBeFocused();
 await page.locator('#repeat').evaluate((node:HTMLButtonElement)=>node.click());await expect(page.locator('#step-readback')).toHaveAttribute('data-focus-events','2');
 await expect(page.locator('#step-readback')).toHaveText(text);await expect(status).toBeEmpty();expect(await saved(page)).toBe(before);
 await page.locator('#menu').click();await expect(page.locator('#step-readback')).toBeEmpty();
 await page.getByRole('button',{name:'Listen to bots play',exact:true}).click();await expect(status).toContainText('Public observation.');
 await expect(status).not.toContainText('Private evidence.');await expect(page.locator('#step-readback')).toBeEmpty();
});

test('review uses its actual opener, and notebook details stay beside their item',async({page})=>{
 await clean(page);await page.getByRole('button',{name:'Learn to play',exact:true}).click();const before=await saved(page);
 await page.locator('#objective-title').focus();
 // Native click deliberately leaves DOM focus elsewhere. This isolates opener
 // tracking; it does not claim to emulate the VoiceOver cursor.
 await page.locator('#notebook').evaluate((node:HTMLButtonElement)=>node.click());
 await expect(page.locator('#panel-title')).toBeFocused();await page.getByLabel('Evidence category').selectOption('location');
 const item=page.getByRole('button',{name:'Archive — unresolved',exact:true});await item.click();
 expect(await item.evaluate(node=>node.nextElementSibling?.hasAttribute('data-detail'))).toBe(true);
 await expect(page.locator('[data-detail]')).toBeFocused();await expect(page.locator('[data-detail]')).toHaveAccessibleName('Archive evidence');
 await page.keyboard.press('Escape');await expect(page.locator('#notebook')).toBeFocused();
 await page.locator('#notebook').click();await expect(page.getByLabel('Evidence category')).toHaveValue('location');await expect(page.getByRole('heading',{name:'Locations, 3 entries',exact:true})).toBeVisible();
 await page.keyboard.press('Escape');expect(await saved(page)).toBe(before);
});

test('opening review or leaving the game cancels a not-yet-published announcement',async({page})=>{
 await clean(page);
 await page.evaluate(()=>{
  [...document.querySelectorAll<HTMLButtonElement>('#entry-controls button')].find(b=>b.textContent==='Learn to play')!.click();
  document.querySelector<HTMLButtonElement>('#rules')!.click();
 });
 await expect(page.getByRole('dialog')).toBeVisible();await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));await expect(page.locator('#announcement')).toBeEmpty();
 await page.keyboard.press('Escape');await expect(page.locator('#rules')).toBeFocused();
 await page.evaluate(()=>{document.querySelector<HTMLButtonElement>('#actions button')!.click();document.querySelector<HTMLButtonElement>('#menu')!.click();});
 await expect(page.locator('#home')).toBeVisible();await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));await expect(page.locator('#announcement')).toBeEmpty();
});
