import type { VisibleEvent, PublicPhase, Investigator } from '../src/types.ts';
import { name, triple } from './content.ts';
export function narrate(e: VisibleEvent): string {
 const d=e.data;
 switch(d.type){
 case 'gameStarted':return 'Case opened. Investigator order: '+d.order.map(name).join(', ')+'.';
 case 'handDealt':return `${name(d.player)}’s private starting evidence: ${d.cards.map(name).join(', ')}.`;
 case 'turnStarted':return `${name(d.player)}’s turn.`;
 case 'moved':return `${name(d.player)} moved from ${name(d.from)} to ${name(d.to)}.`;
 case 'suggested':return `${name(d.player)} asks: ${triple(d.hypothesis)}?`;
 case 'passed':return `${name(d.player)}: Cannot refute. None of my cards match.`;
 case 'refuted':return `${name(d.player)} refuted ${name(d.recipient)}’s suggestion. The selected card is private.`;
 case 'evidenceRevealed':return `Private evidence. ${name(d.player)} showed ${name(d.recipient)}: ${name(d.card)}. This card cannot be in the hidden answer.`;
 case 'suggestionClosed':return d.refuter ? 'The question is complete. Refutation stops at the first reveal; anyone not asked has not passed.' : 'Every other investigator passed. The question is complete.';
 case 'turnEnded':return `${name(d.player)} ended the turn.`;
 case 'accused':return `${name(d.player)} accused: ${triple(d.hypothesis)}. ${d.correct?'Correct.':'Incorrect. Active turns are lost, but this investigator must still answer refutations.'}`;
 case 'gameEnded':return d.winner?`${name(d.winner)} solved the case.`:'The case ended without a winner. Everyone made an incorrect accusation.';
 }
}
export function situation(phase: PublicPhase, investigators: Investigator[]): string {
 if(phase.kind==='finished')return phase.winner?`${name(phase.winner)} has won. The case is complete.`:'Case complete. No winner.';
 if(phase.kind==='refutation')return `${name(phase.player)} asked: ${triple(phase.hypothesis)}. ${name(phase.responder)} must respond.`;
 const location=investigators.find(p=>p.id===phase.player)!.location;
 return `${name(phase.player)}’s turn, at ${name(location)}. ${phase.suggested?'Question complete. Accuse or end the turn.':phase.moved?'Move used. Ask a question, accuse, or end the turn.':'One connected move is available before a question. You may also stay.'}`;
}
