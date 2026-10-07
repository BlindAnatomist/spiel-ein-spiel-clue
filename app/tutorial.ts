import type { Action, Hypothesis } from '../src/types.ts';
export const PRACTICE_SEED = 'lesson-23936';
export type Lesson = { title: string; text: string; kind: 'continue' | 'hand' | 'notebook' | 'action' | 'bot' | 'choice' | 'finished'; action?: Action; card?: string };
const h = (suspect: string, method: string, location: string): Hypothesis => ({suspect,method,location});
const question = (s: string, m: string, l: string): Action => ({type:'suggest',hypothesis:h(s,m,l)});
const info = (title: string, text: string): Lesson => ({title,text,kind:'continue'});
const bot = (text: string, action: Action): Lesson => ({title:'Next exchange',text,kind:'bot',action});
const end: Lesson = {title:'Finish your turn',text:'Your question is complete. End your turn so the next investigator can ask a question.',kind:'action',action:{type:'endTurn'}};
const quietTurns: Lesson[] = [end,bot('Lena ends this teaching turn without a question.',{type:'endTurn'}),bot('Otis ends this teaching turn. Your next question is ready.',{type:'endTurn'})];
// Only the current lesson is projected to the renderer. Future answers remain host-side.
export const lessons: Lesson[] = [
 info('The missing dispatch','A dispatch disappeared. Find the suspect, method, and location. One card from each category is hidden as the answer. Every other card was dealt to investigators. You are Rowan; Lena and Otis are fellow investigators. Suspect cards name different people.'),
 {title:'Review your starting evidence',text:'Open My evidence and read your two actual cards. A card you hold cannot be in the hidden answer. Holding Mira does not accuse Mira: it rules Mira out. Investigators possess evidence; they are not the people named on suspect cards.',kind:'hand'},
 {title:'Move to the Workshop',text:'You are in the Archive. The Workshop and Garden are directly connected. You may move along one connection before asking a question. Choose Move to Workshop for this teaching route. No dice or grid are involved.',kind:'action',action:{type:'move',destination:'location-b'}},
 info('One connection travelled','You moved from the Archive to the connected Workshop. That used your one move this turn. You can now ask about the Workshop, or end your turn. We will ask a question.'),
 {title:'Build your first suggestion',text:'A suggestion is a question, not a final answer. Open Make a suggestion. Select Mira and Copied key, then review it. The location is the Workshop because you are there. This practice uses specific questions; ordinary play lets you choose freely.',kind:'action',action:question('suspect-a','method-a','location-b')},
 bot('Lena is the first investigator asked. Next exchange lets her answer your question.',{type:'reveal',card:'location-b'}),
 {title:'Find the private evidence again',text:'Lena privately showed you Workshop. That card cannot be hidden as the location. Otis knows Lena answered, but not which card she showed. Open the notebook, choose Locations, and open Workshop. Its recorded source will still be there after this lesson.',kind:'notebook',card:'location-b'},
 info('Why this question was controlled','You hold Mira and Copied key. Nobody else can hold either card. So another investigator answering that question must show Workshop. Refutation stops at the first reveal: Otis was never asked, and must not be counted as having passed.'),
 end,
 bot('Lena asks about Mira, Copied key, and the Garden. She is already in the Garden.',question('suspect-a','method-a','location-c')),
 bot('Otis is asked first. Next exchange lets him respond.',{type:'pass'}),
 {title:'Choose one card to show Lena',text:'You hold two matches: Mira and Copied key. Choose either one. Only Lena receives the card you select. The other matching card stays private. You cannot pass when you hold a match.',kind:'choice'},
 info('One card, one recipient','Lena received only your selected card. Otis knows you refuted her suggestion, but not which card you chose. Both choices lead to the same next lesson.'),
 bot('Lena ends her turn.',{type:'endTurn'}),
 bot('Otis moves from the Workshop to the Garden, along a direct connection.',{type:'move',destination:'location-c'}),
 bot('Otis asks about Dorian, Forged message, and the Garden.',question('suspect-b','method-b','location-c')),
 {title:'When you cannot refute',text:'None of your cards match this question. Cannot refute is your only legal response. Passing is a statement about your hand, not an optional bluff. Choose it to let the next investigator answer.',kind:'action',action:{type:'pass'}},
 bot('Lena is now asked. Her selected evidence will be private to Otis; you will hear only that she answered.',{type:'reveal',card:'suspect-b'}),
 bot('Otis ends his turn.',{type:'endTurn'}),
 {title:'Test another location',text:'Move to the Archive. You can use your two held cards to ask a controlled question about this location too.',kind:'action',action:{type:'move',destination:'location-a'}},
 {title:'Ask about the Archive',text:'Choose Mira and Copied key again. You hold both, so any refutation must concern the Archive.',kind:'action',action:question('suspect-a','method-a','location-a')},
 bot('Lena is asked first.',{type:'pass'}),
 bot('Lena could not refute. Now Otis is asked.',{type:'reveal',card:'location-a'}),
 info('A second recorded location','Otis showed Archive. You now have direct evidence excluding both Archive and Workshop. Their sources remain in the notebook. Next we will test the remaining location and learn what a complete round of passes means.'),
 ...quietTurns,
 {title:'Move to the Garden',text:'The Garden is connected to the Archive. Move there to test it with the same two held cards.',kind:'action',action:{type:'move',destination:'location-c'}},
 {title:'Test the Garden',text:'Suggest Mira, Copied key, and Garden. You hold the first two cards and do not hold Garden.',kind:'action',action:question('suspect-a','method-a','location-c')},
 bot('Lena is asked about this suggestion.',{type:'pass'}),
 bot('Lena passed. Otis must also answer before we draw the all-pass conclusion.',{type:'pass'}),
 info('What every pass establishes','Both other investigators passed. You hold Mira and Copied key, and nobody holds Garden. Therefore Garden is the hidden location. This does not make Mira or Copied key part of the answer: you hold them. An unrefuted suggestion does not automatically identify all three hidden cards. The notebook remains conservative: Garden stays Unresolved because this is a deduction, not a card shown to you.'),
 ...quietTurns,
 {title:'Investigate a suspect',text:'Stay in the Garden. Suggest Dorian and Copied key. Copied key is in your hand, and you have deduced that Garden is hidden. Any refutation must therefore concern Dorian.',kind:'action',action:question('suspect-b','method-a','location-c')},
 bot('Lena is asked about Dorian, Copied key, and Garden.',{type:'reveal',card:'suspect-b'}),
 info('Use the suspect evidence','Lena showed Dorian. You hold Mira, and Dorian has now been shown to you. Those are two of the three suspects. Selene is the only suspect left. This conclusion comes from your evidence, not from another investigator’s private information.'),
 ...quietTurns,
 {title:'Investigate a method',text:'Suggest Mira and Forged message in the Garden. Mira is in your hand; Garden is hidden. A refutation can only concern Forged message.',kind:'action',action:question('suspect-a','method-b','location-c')},
 bot('Lena is asked first.',{type:'pass'}),
 bot('Now Otis is asked.',{type:'reveal',card:'method-b'}),
 info('Assemble your answer','Otis showed Forged message. You hold Copied key, so Cut cable is the only method left. Your evidence now supports Selene, Cut cable, and Garden. You can review every shown card in the notebook before committing.'),
 info('A final accusation is different','A suggestion gathers information. A final accusation attempts to win. If any part is wrong, you lose your active turns, but must still answer others’ suggestions. If everyone fails, nobody wins. You need not make a wrong accusation to learn this rule. The next step reviews your exact answer before you confirm it.'),
 {title:'Make your final accusation',text:'Choose Selene, Cut cable, and Garden. Review the complete accusation, then confirm when ready. Cancel returns you to your choices without changing the game.',kind:'action',action:{type:'accuse',hypothesis:h('suspect-c','method-c','location-c')}},
 {title:'Practice complete',text:'You solved the practice through the same rules used in ordinary play. In Play a game, the mystery is fresh and the teaching route stops. Movement, questions, private responses, confirmation, notebook, rules help, and manual pacing remain the same. Unresolved still means not directly eliminated, rather than proven possible.',kind:'finished'},
];
