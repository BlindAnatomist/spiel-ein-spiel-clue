# Vaudrey House: narrative and game-logic audit

Date: 2026-10-06.
Status: completed design review; repairs below are recommendations, not silently approved replacement canon.
Scope: the originating world-building conversation, the saved WORLD_AND_CAST.md, and the relevant rules/content/host implementation.

Read this audit before implementing the full fictional content or producing character dialogue. Preserve the original world document as the version under review. The premise is worth retaining, but several detailed claims and connections are not yet reliable enough to become production constraints.

## Evidence and verification boundary

Reviewed branch: feat/guided-browser-checkpoint.
Pre-audit branch head: 63fee79bd51f0287a06f198295f1cf81fe73ba13.
Reviewed WORLD_AND_CAST.md blob: 6c14f08d8d8988979a539fe5c778884257091c81.

Repository sources:
1. WORLD_AND_CAST.md: premise, Calder history, deposition, cast, stratagems, locations, relationships and narrative rules.
2. FOUNDATION.md: independent categories, evidence guarantees, movement, private refutation and baseline policy contracts.
3. ../src/referee.ts: constructor independently selects each solution component and deals every other card.
4. ../app/content.ts: the current small content and label configuration.
5. ../app/host.ts: all modes currently instantiate the same content; save restoration replays against that configuration.
6. CONTINUATION.md and ../README.md: continuation and entry-point documentation.
7. Pull request 1 metadata: still open at the reviewed head. The audit does not assert that earlier CI results establish this new narrative's correctness.

Verification performed: current repository reads, textual and causal consistency review, inspection of the relevant host/setup code, and a breadth-first shortest-path calculation on the proposed location graph.
Not performed: a full application code audit, new browser/engine test execution, iPhone VoiceOver acceptance, a complete period legal/medical review, or exhaustive narrative validation of all 324 proposed solution combinations.

The historical reference checks below support only their stated narrow claims. Literary judgments and proposed repairs are editorial analysis, not externally established facts.

## Overall verdict

Keep the distinction between fixed history and a variable present-day theft. Keep the ensemble, the information-centered house, the possibility of stealing testimony to preserve rather than destroy it, and the separation of tutorial from full game.

Do not proceed directly to speaking styles. First define a coherent case contract, chronological record, and knowledge ledger. The existing prose is more finished than its underlying causal specification.

## A01. Sabine's concealed identity is inconsistent

Classification: explicit inconsistency in the conversation; unresolved identity logic in the saved document.

An earlier passage says that Sabine is not really named March. A later passage names her father Samuel March while continuing to call her Sabine March and treating her parentage as concealed. The repository preserves the shared surname but not an alias explanation.

Using the same surname is not logically impossible, but the story owes a reason that Honora and an estate solicitor would not investigate an authorized biographer with that name. The original alias proposition and the later naming are not one settled account.

Recommended repair: distinguish birth name, public/professional name, which name appears on the suspect card, and who knows the connection. Prefer a public surname different from Samuel's if infiltration remains part of the premise. Do not choose a replacement name merely to close the audit; record the identity decision deliberately and update every relationship using it.

## A02. The deposition has no creation or custody timeline

Classification: major missing causal specification, not proof that the premise cannot work.

The document is complete, includes knowledge from Clement's final illness, survives Honora's earlier suppression and Fenwick's treatment, and becomes a sealed posthumous object. The intervening actions are unspecified.

Required facts: when each section was composed; who wrote, typed or took dictation; whether it is a formal sworn deposition or a private signed statement; who witnessed/authenticated it; when it was sealed; who held it before and after death; why it is opened on this occasion; and what copies exist.

The medical episodes need an ordering. A completed account can describe earlier periods of sedation; it cannot describe later events without a later addition or another narrator. Do not rely on an unexplained lucid interval to solve every chronology problem. Do not convert Clement's perception of treatment into proof of the doctor's intent or of clinical appropriateness.

Recommended repair: a dated main statement and, only if needed, a separately authenticated later addition. Specify the recorder and custody chain without automatically appointing a suspect to a role that makes only that suspect capable of the present theft.

Also fix a calendar and age ranges. Seventeen years is compatible with an older engineering/household generation and a younger daughter, doctor and solicitor, but their jobs and knowledge at Calder must be possible at their then ages.

## A03. Authorial truth, testimony, and motive have been conflated

Classification: epistemic design error.

The world document calls the deposition fixed truth, while also treating several of Clement's statements as motives or interpretations. His claim that he allowed Miriam's copies to survive may be true, self-exculpatory, or partly true. His claim about why he retained Fenwick is not independent corroboration of his own moral generosity.

Maintain separate records for: what actually happened in the authored history; what Clement states; what independent material supports; what each living person believes; and what remains interpretively unresolved. Fixed history does not require an infallible narrator.

A motive must also be available before the theft. A revelation learned only when the missing statement is finally read cannot by itself explain a suspect's earlier decision to take it. For example, Fenwick's later discovery that Clement knew his identity is a powerful reaction, but not automatically a pre-theft motive. His concern that the document describes his treatment can be a motive if he has grounds to expect that.

Recommended repair: give each suspect a specific pre-theft expectation of the document, the source of that expectation, and a desired action upon obtaining it. Do not grant the cast the author's inventory of six revelations.

The rhetorical governing sentence also needs precision: the playable question is who took the statement, how, and where it is concealed. Learning what the statement says is a narrative payoff, not an additional hidden category currently solved by the engine.

## A04. The opening theft is an image, not yet an executable sequence

Classification: production-blocking case gap.

A canister arrives empty. This does not yet establish when it was emptied, whether it is the same carrier, whether the document was ever inside, whether a seal was broken, or whether the package was diverted before or after dispatch.

Specify: the last reliable observation of the actual packet; the carrier's identification; whether packet, carrier or both are sealed; the complete transfer window; what is independently observed at receipt; and the reason theft, rather than an ordinary failure or misloading, is established.

Avoid an opening clue that already singles out one method. A confirmed substituted carrier cannot be an invariant opening if carrier substitution is only one of six possible answers. Conversely, an unbroken uniquely authenticated seal cannot be asserted without an explanation compatible with every supported method.

Two separate networks are needed: the walkable room connections and the pneumatic dispatch apparatus. A room adjacency does not establish a tube junction. Reversing pressure or suction is not, by itself, a specification for routing a carrier to a selected branch. The fictional installation needs named, comprehensible access points and controls.

Why risk this particular original in the house system rather than carry it by hand? A routine or established security procedure can answer that. The answer must exist before the crime, not be invented afterward to excuse it.

Finally identify the launch/receipt witnesses, servants or messengers, and why only these six suspects can be the thief. Supporting characters must not create unexplained seventh candidates. Do not solve closure with a blanket alibi that accidentally clears the generated culprit.

## A05. The six stratagems do not yet define six exclusive answers

Classification: rules-to-fiction mismatch; no claim of an existing engine defect.

The engine chooses one method. The proposed list mixes a tool, diversions, a substitution, a machinery intervention, an alarm intervention and an impersonation.

A forged summons can lure a clerk away; a copied key can then provide access; a carrier can then be switched. That is a plausible theft employing three listed stratagems, not three clearly alternative thefts. Disabling an alarm or impersonating a messenger does not, alone, explain an empty arriving carrier. An impersonation also needs a credible way to work among people who know one another.

Recommended repair: define method as one decisive, self-contained breach of the dispatch custody procedure. Give each candidate a short beginning-to-end sequence, required ordinary access, and a reason no second listed breach is required. Do not preserve all six labels at the expense of category precision. The six-method target can remain while particular methods are replaced.

Distinguish ordinary access and preparation from the decisive breach consistently. It is insufficient to call whatever happened 'the main stratagem' only after a contradiction appears.

## A06. Replayability requires more than six plausible motives

Classification: missing combinatorial plausibility contract.

The proposed content has 6 x 6 x 9 = 324 solution triples. The referee currently selects suspect, method and location independently. A convincing motive for each suspect does not establish that every combination works.

All six suspects must plausibly perform each available decisive method, and the resulting packet must plausibly reach any of the nine final hiding rooms. Fixed characterization must not make the engineer the only person who can operate an essential control. Likewise, a fixed alibi, inaccessible room, impossible timing, or required accomplice can invalidate a generated case.

Preferred repair: preserve independent categories and make every allowed triple feasible under the same case rules. If a later design instead restricts combinations, that is a deliberate generator/inference change: restrictions must be represented consistently for players and bots, not hidden in prose or implemented as undocumented rerolls.

Validation should include one coherent reconstruction for every suspect-method pair and a feasible concealment path for each location. Ultimately check all 324 triples and the factual content of every generated ending. This audit has not performed that validation.

## A07. 'Where concealed' needs a time and persistence rule

Classification: missing invariant.

The fictional location is now the packet's hiding place, not necessarily where it was intercepted. That is a workable distinction, but every suggestion and ending must use it consistently.

For the existing static engine, the simplest proposed contract is: one actor intercepted the actual packet; it remains intact in one final location at the start of the investigation; it is not moved, destroyed, divided or taken out of the defined area during play. A motive to destroy it later does not imply destruction has already occurred.

No accomplice should perform a necessary theft/concealment step unless the meaning of the single suspect answer is deliberately redefined. A request for two culprits cannot be represented by one suspect card.

Room questions can be presented as reconstructing or testing concealment there, not as a search action that automatically finds the packet. The current game does not implement physical rummaging or automatic discovery on entry.

## A08. The cards and dialogue require separate truth contracts

Classification: critical integration requirement.

A held suspect card clears that person of this game's theft. It does not accuse them or clear them of Calder wrongdoing. A held room card excludes the room as the final hiding location. Historical distrust is not equivalent to either form of exclusion.

Example: a record showing that Gideon lied at Calder does not establish whether he intercepted tonight's packet. If the UI uses that record to explain a Gideon card, it would give the evidence the wrong logical meaning.

Use three distinguishable channels:
1. Case evidence: guaranteed procedural facts represented by the referee and notebook.
2. Historical testimony/documents: fixed narrative material, potentially disputed or incomplete.
3. Character conversation: speech whose honesty and implications depend on the authored person and knowledge state.

Even optional speech must not contradict a valid case or quietly eliminate solution options. 'I was continuously witnessed elsewhere' is a case constraint, not harmless atmosphere. If such a line varies by case, it needs a properly authorized factual basis.

Character voices must not replace mandatory truthful investigator refutation with discretionary suspect testimony. Public narration must not draw from another investigator's private evidence. Do not add new actionable clues through a dialogue generator unless the rules, provenance and notebook track them.

## A09. The investigators have epistemic labels but no shared fictional job

Classification: premise gap.

Rowan, Lena and Otis are defined by provenance, contradiction and mechanism. The current engine nevertheless has competing investigators who conceal some evidence, reveal only one match, and race to a final accusation.

We have not explained who commissioned them, why all three are present, why each begins with private evidence, why they compete instead of pooling it, or why a failed accusation removes active turns while leaving their duty to respond.

Recommended repair: choose a light, credible frame for independent competing reconstructions, or explicitly retain these as board-game conventions. Do not invent a false legal procedure merely to rationalize every rule. Their epistemic interests should not imply actual distinct bot policies before those exist.

The current interface asks other investigators to refute structured propositions. It is not yet a suspect-interrogation engine. Adding a cast does not automatically implement conversations with that cast.

## A10. The Calder financial revelation skips its essential legal connection

Classification: unsupported causal assertion, not a verified conclusion about Victorian law.

A forged compensation signature and a transfer of patent/property rights are introduced as if they necessarily belong to the same ownership chain. The draft has not specified what the widow owned, what instrument purported to transfer it, or why a release of claims affected title to the estate.

We should not treat 'the estate is contaminated by fraud' as a complete legal mechanism. Intellectual authorship, legal ownership, royalties, compensation, asset acquisition and estate administration are different relationships.

Recommended repair: separate the fraudulent compensation arrangements from Gideon's coerced rights transfer unless one concrete document genuinely connects them. Tobias can have strong present stakes in concealed misconduct, his handling of the files and the estate's response without a claim that the entire fortune automatically changes owners.

If defective title remains essential, specify the property, transferor, transferee, instrument and defect, then verify the relevant period law. Patent filing dates, duration and later royalty/share arrangements also need to fit the seventeen-year interval. No assertion about those legal outcomes has been verified by this audit.

## A11. Clement's causal responsibility was softened by a false distinction

Classification: reasoning error in the originating prose.

The formulation that Clement 'caused the conditions for the accident, but not the accident itself' separates contribution from consequence too neatly. The proposed chain is: known fault; warning; decision to proceed; false clear signal; supervisor's restart; deaths. The decision to proceed is part of that chain even though Clement did not press the control or intend the deaths.

Recommended formulation: he did not intend the deaths, but knowingly authorized the dangerous demonstration and later organized a cover-up. Distinguish intent, causal contribution and subsequent deception without using the absence of a direct physical act as exoneration.

Still missing: the exact record that falsely implicates Samuel, who altered it, how its contents explain the supervisor's restart, and what contradictory records or witnesses originally existed. Gideon's alteration of a different laboratory record must not be casually substituted for the false control record.

Two independent defects and two altered records may be defensible, but they increase the explanatory burden. Preserve that distinction explicitly or simplify it deliberately; do not allow retelling to merge them.

## A12. Miriam's seventeen years of silence need a concrete account

Classification: central motivation gap.

The draft makes Miriam the holder of potentially exculpatory copies, a covert guide to Sabine, and a critic of Gideon's retreat, but leaves her own failure to disclose largely unexplained. Hypocrisy can be intentional characterization; it should not be mistaken for moral clarity.

Required decisions: what exactly her copies prove; whether they can be authenticated independently; what she believed would happen if she disclosed them; what she did while Samuel was alive; and what changed after Clement's death.

Recommended direction, not new canon: the copies demonstrate substantial manipulation but lack one necessary element of authentication or connection. The statement supplies that element while exposing Miriam's involvement. This gives the new document a distinct function without magically making all earlier evidence worthless.

Clement's assertion that he permitted her copies to survive must not automatically turn years of his own suppression into a benevolent arrangement. His claimed motives belong under A03's distinction between history and testimony.

## A13. The relationship web lacks sources for what people know

Classification: incomplete knowledge model and overused dramatic device.

Several revelations rely on one person not realizing that another knows a secret. This can work, but each needs a discovery event, a date and an ongoing reason for nondisclosure.

Current example: Clement knew Fenwick's family connection; Miriam knows it; Rook knows it; Sabine knows he lost a close relative at Calder; Gideon suspects a personal interest. Fenwick's belief in concealment is not automatically impossible, but it is now a specific mistaken belief that needs support, not a safe narrator description of a secret.

Likewise, Gideon and Miriam both know Honora destroyed confession pages. Their access to that event is not explained. Miriam also somehow knows Tobias discovered the forged signature and deliberately failed to act. Possessing the underlying file and knowing Tobias's subsequent knowledge are different facts.

Build a knowledge ledger for each consequential fact: actual truth; witnesses/documentary sources; direct knowers; second-hand knowers; people who merely suspect; false beliefs; who knows who else knows; and the point at which the player may learn it.

Do not resolve every gap by making Miriam omniscient. Do not use 'recognized from the emotional pattern' as factual knowledge of a specific parentage or kinship.

## A14. Fifteen relationships have become variations on leverage

Classification: artistic and structural weakness, not an arithmetic error.

Six suspects do have fifteen possible pairs. There is no requirement that all fifteen carry a major reciprocal secret. Most current pairs use guarded civility, concealed records, mutual suspicion or withheld recognition. That creates density without enough variation in lived relationship.

The document itself requires affection or respect, but most dyads remain transactions. Miriam approaches an all-knowing custodian, Rook an all-knowing legal gatekeeper, and Clement an all-knowing dead organizer.

Recommended repair: concentrate major plot pressure in several pairs, let some relationships be asymmetrical or comparatively ordinary, and give at least two bonds a present value independent of Calder. Vary power, trust, familiarity, dependence and the willingness to forgive, not merely the secret being held.

Also vary temperament before verbal tics. Many of the current descriptions lead to six controlled, precise, withholding speakers. Speech differences should arise from wants and habits, not six synonyms for restraint.

## A15. Suspicion does not require universal historical culpability

Classification: contradiction between a universal design rule and the biographies.

The rule that every suspect has already committed/enabled/concealed something morally consequential is not established for Sabine. Fenwick's uncertain treatment motive is not proof of wrongdoing either. We should not invent a crime for Sabine just to make the cast satisfy a symmetrical template.

'No fixed thief' does not mean 'everyone must be equally culpable.' An innocent person's decision to take a document for safekeeping can be procedurally the theft while being morally different from suppressing it.

Recommended rule: everyone has consequential stakes and a plausible reason to take control of this packet tonight; historical responsibility and moral standing may be unequal. Each needs at least one convincing theft motive, not an identical pair of destroy/preserve motives. A forced symmetry weakens distinct character.

## A16. Period details: one title issue and bounded historical support

Classification: smaller continuity issue plus remaining research requirements.

'Lady Honora Vaudrey' requires a birth-status decision. For a wife whose style derives only from a knight or baronet, the usual form is Lady Vaudrey. The first-name form is appropriate if she has the relevant courtesy style in her own right, such as being an earl's daughter. We have not established that background. Nor have we established whether Clement was a knight or a baronet, which matters to later title/succession details.

Reference: Standing Council of the Baronetage, 'Addressing a Baronet': https://www.baronetage.org/baronets/addressing-a-baronet/ (consulted 2026-10-06). This supports the narrow forms-of-address issue, not a newly selected family history.

The pneumatic premise is not itself an anachronism. The Postal Museum records small message-tube operation in 1853 and subsequent expansion; the Smithsonian describes compressed-air and suction operation. These sources support the broad technology, not the particular routing machinery, house installation or security protocols we have yet to invent.

References: The Postal Museum, 'The Pneumatic Railway', accessible indexed version https://staging1.postalmuseum.org/blog/the-pneumatic-railway/; Smithsonian National Postal Museum, 'Pneumatic', https://postalmuseum.si.edu/exhibition/about-postal-operations-transportation/pneumatic (consulted 2026-10-06).

No clinical conclusion should be drawn from the morphia episode. The fiction must distinguish a prescription, its observed effects, a patient's interpretation, and an author's decision about intent. Exact period practice and document formalities remain research tasks once the desired plot facts are specified.

## A17. The full content pack is not yet technically separated from practice

Classification: integration work understated in the earlier assessment.

The engine accepts the planned category sizes. However, app/host.ts creates a Referee with the same imported content in learn, play and listen modes. The scripted tutorial depends on its current seed, cards, labels and legal route.

Replacing app/content.ts in place with the 6/6/9 set would affect practice as well as ordinary play. It would also change the configuration against which stored journals are replayed; existing saves could fail validation.

Required implementation: explicit practice/full pack selection; pack-aware label lookup and public metadata; stable IDs; a content/version identifier in saves; and restoration that uses the matching pack or clearly rejects an incompatible save without overwriting it. Observation perspectives should remain validated against the active pack.

This is not a requirement to rebuild the deduction engine. It is real host/content/save work, not just renaming nine labels. The audit made no application changes.

## A18. The room graph is valid; balance remains untested

Classification: checked structure, unproven game quality.

Using the ten bidirectional links in WORLD_AND_CAST.md, a breadth-first calculation gives nine vertices, ten undirected edges, a connected graph, and maximum shortest distance of four moves. All rooms have degree two except Gallery and Workshop, which have degree three. Mean shortest distance between distinct rooms is 13/6, approximately 2.17 moves.

There are no mandatory single-edge chokepoints in this proposed network. The Winter Garden provides an alternative cross-route; this does not prove strategic balance.

The current rule allows one connection of movement per turn. Reaching a chosen room can therefore take four of an investigator's turns, although intermediate-room questions remain possible. The small tutorial has direct connections among its three rooms. The effect on pace and baseline-bot decisions must be tested rather than inferred from the map's thematic elegance.

The card arithmetic is correct: 21 total cards minus three hidden cards leaves 18, or six for each of three investigators. That does not by itself prove three investigators is optimal. The full triple space is 324 rather than the tutorial's 27; this is twelve times the initial combinations, not evidence that play takes twelve times as long.

## A19. Preservation did not equal reconciliation or approval of every detail

Classification: project-record quality issue.

The prior save was real and verified, but some earlier proposals were omitted or changed without a decision record. Examples from the originating conversation include Honora destroying bribery correspondence before the later confession-pages version, Fenwick's certification of Clement's competence, and Sabine's initial alias premise.

Do not automatically restore all of these as additional secrets. Mark each retained, superseded or unresolved. Otherwise apparent character complexity becomes an accumulation of incompatible drafts.

The original relationship dyads were also introduced as working design. General user approval of the world does not mean that every later source of knowledge or legal implication was independently validated.

The narrative and audit are on the active feature branch, not merged into main. Future entry points must continue to identify that branch. This review does not approve a merge, claim real-device acceptance, or authorize publication of private notes.

## Corrected dependency order

1. Case contract: exactly what counts as theft, the method answer, the location answer, one actor, finite scope and time boundaries.
2. History/document timeline: Calder sequence, original falsifications, later knowledge, statement creation and custody, death and transfer window.
3. Knowledge ledger: distinguish authorial facts, testimony, belief, provenance and pre-theft motive.
4. Relationship revision: repair aliases and unsupported secrets; remove forced culpability and repetitive leverage.
5. Combinatorial check: make all supported suspect-method-location reconstructions coherent; define case evidence versus historical disclosure.
6. Content integration and pacing tests: separate packs and saves; preserve practice; measure the proposed graph with the actual game.
7. Speaking architecture and sample scenes, then larger dialogue/voice/music production.

A useful next durable artifact is a short CASE_CONTRACT.md plus a chronological/knowledge record, not another round of polished character monologues. These are proposed next deliverables, not files claimed to exist.

## Acceptance standard for the revision

A reader should be able to explain the opening theft without guessing an unstated step; explain why each suspect might act before knowing the statement's revelations; distinguish a present-case proof from a historical allegation; reconstruct every allowed solution; and trace every consequential secret to someone who could actually have learned it.

The revision succeeds when the story's precision catches up with the confidence of its prose.
