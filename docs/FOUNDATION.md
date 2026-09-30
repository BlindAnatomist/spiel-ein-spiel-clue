# Foundation

## Ownership and scope

`BlindAnatomist/spiel-ein-spiel-clue` is authoritative. This is an original deduction game, not a reproduction of Clue/Cluedo fiction or board design. The engine contains IDs and domain facts; eventual characters, dialogue, descriptions, and accessible labels belong to a separate content/presentation layer.

The engine has no DOM, browser, screen-reader, audio, LLM, or external-service dependencies. No external TTS or generated dialogue belongs in this checkpoint.

## Referee and information contracts

The trusted referee alone owns solution, hands, seed, command archive, and complete ledger. Setup selects exactly one card from each of suspect, method, and location. It shuffles and deals every other card once, round-robin in seeded player order. Starting locations are independently seeded; shared occupancy is allowed.

A `PlayerView` is a recursively frozen, detached, serializable allowlist: public content, order, positions, hand counts, elimination status, phase, own hand, own notebook, permitted events, and own legal actions. It contains no seed, solution, other hands, private third-party reveals, other players' reveal choices, or bot reasoning. Finished games retain these boundaries; a correct public accusation naturally establishes the solution.

A bound `PlayerPort` has only `view()` and `act(action)`. Hosts authenticate identity before binding it. Bots receive only one PlayerView argument, never a referee or a callback granting arbitrary player access. Referee methods including `view(player)`, spectator projections, archives, and debug exports are trusted-host capabilities, not client endpoints.

Private fields and immutable projections prevent accidental reference leaks and mutation. They do not sandbox malicious plugin code executing with host privileges. In a future browser build, keep the referee on a trusted host or isolated worker with narrowly defined messages; a worker alone cannot hide secrets from a user controlling that browser. Do not promise adversarial secrecy for an entirely local browser game.

## Initial rules

1. Content supplies globally unique abstract card IDs, 2–12 per category, 2–6 unique player IDs, and directed routes. Each player must receive at least one card. Routes must form a strongly connected graph. Declare both directions for a two-way route.
2. On a turn, an active investigator may move along one outgoing edge, make at most one suggestion, accuse, or end the turn. Movement is optional and must precede suggestion. A suggestion's location must equal the investigator's current location. No dice, grid, coordinates, visual adjacency, or token displacement.
3. Refutation visits every other player in cyclic order, including eliminated players. Only the current responder may act. A responder holding matches must choose exactly one matching card; they cannot pass. If no match exists, pass is the only legal action.
4. The first reveal ends refutation. The public learns who refuted whom and the proposed triple, but not the selected card or alternate matches. Only sender and recipient receive the card. If everyone passes, a public event closes the suggestion without a refuter.
5. After refutation, the investigator may accuse or end their turn; they cannot move or suggest again. Accusations may name any valid triple, independent of location, but cannot interrupt refutation.
6. A correct accusation wins immediately. A failed accusation publicly excludes that complete triple, ends that investigator's active turns, and retains their refutation duty. It does not identify which component was wrong. If every investigator fails, the game ends without a winner. The final remaining active investigator must still solve the case.
7. Illegal and malformed actions reject before state, archive, or ledger mutation. Legal choices are derived from rules and the acting player's own hand, never from the solution.

Routes are explicit directed edges, so passages can be added without grid assumptions. Conditional restrictions and multiple movement budgets are deferred rules changes, not hidden promises in the current route model.

## Notebook

Each player's notebook is independently reconstructed from that player's visible ledger. Entries distinguish personally held, directly revealed, and unresolved evidence. Directly known cards are eliminated from the hidden solution. Reveal provenance preserves sender and event reference. Public facts separately retain cannot-hold constraints, holds-at-least-one constraints, and failed accusation triples.

The human notebook performs no combinatorial closure, singleton solving, or all-pass inference. Unresolved means not directly eliminated, not mathematically feasible after every possible deduction. A future review UI can filter by category/status, retrieve a card entry, inspect reveal provenance, and review public constraints without automatically solving the case.

## Ledger and replay

Every event has a stable ID and explicit public, private-with-recipients, or referee visibility. Setup, accepted commands, and bot decision diagnostics are referee-only. Evidence deals are private to their owner. Reveals are private to sender and recipient. Public events capture turns, moves, hypotheses, passes, refutation occurrence, closure, accusations, and outcome.

- `publicLedger(throughId?)` supports public mystery listening.
- `followLedger(player, throughId?)` supports a chosen investigator's permitted information, including their initial hand and both sides of their reveals.
- `debugLedger()` supports complete inspection, including initial solution/deal and per-decision notebook plus actual reasoning inputs. Notebooks at any event boundary can be reconstructed from filtered events. No public post-hoc explanation is fabricated.
- `archive()` captures versioned content, seed, and accepted commands/metadata. `replay(archive)` regenerates the exact event ledger and current state. A seed alone reproduces setup; complete replay also requires the action sequence, or the exact same deterministic policy version.

Ledger prefixes prevent future information entering a historical replay. Event IDs can have gaps after projection; they are references, not a completeness guarantee. Archives and seeds are secrets because they reconstruct the deal. Exporting an omniscient archive must be a separate deliberate host operation. Replay files currently have no integrity signature, persistence adapter, migration, or untrusted-file parser.

## Baseline reasoning

The baseline policy is pure and deterministic. It reconstructs its independent knowledge from its own view on each call. It eliminates directly known evidence and publicly refuted/failed triples. It uses category singletons and its own all-pass suggestions to establish solution components. It selects the first remaining candidate in configured order, follows a shortest directed path to its location, and tests it. A unique remaining candidate triggers accusation.

On refutation, it prefers a legal card already shown to that recipient, otherwise the first legal match. Reason codes and facts are produced by the very branch selecting the action: candidate counts, known solution components, selected card, destination, and suggestion reference where relevant. It does not claim entropy optimization or personality. Stronger policies can implement the same `BotPolicy` signature without changing rules.

## Blind-first presentation contract

The future human adapter must use native semantic controls to select structured actions. Refutation choices must come exclusively from the current view's legal reveal actions. Waiting players receive no actionable refutation choices. Use stable IDs and explicit phase/actor changes to drive deterministic focus; do not move focus on every ledger append.

Provide concise text announcements, with all important information retained in a reviewable transcript, state summary, and notebook. Provide review of current turn, location, legal destinations, hand, suggestion, responder, prior evidence, and game outcome on demand. No action or information may depend on visual position, color, animation, images, or audio. Version 1 dialogue/narration is accessible text spoken by built-in VoiceOver. No custom speech queue or synthesized character voices.

The headless tests establish information and action contracts. They do not constitute iPhone/VoiceOver usability testing; that belongs to the next checkpoint's actual interface.
