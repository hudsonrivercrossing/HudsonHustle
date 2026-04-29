# Board Layout Revamp Plan

## Purpose

Redesign active gameplay from a panel dashboard into an immersive, map-first play surface.

The board should feel like the main stage. Controls should behave like edge-mounted game HUD instruments: always available when needed, visually subordinate to the map, and stable enough that cards, tickets, and actions do not shift layout during play.

This revamp is allowed to ignore the existing system component set when that helps the gameplay surface. The first implementation should still feel related to Hudson Hustle's current warm, tactile, transit-nostalgia direction, but the gameplay board layout does not need to preserve the current `Panel` / `SurfaceCard` / dashboard composition.

The goal is not more UI. The goal is a more playable game view: fewer permanent facts, stronger map presence, stable private inventory, and lightweight feedback.

## Terms

- `Active player`: the player whose turn it is.
- `Viewer player`: the local human looking at the screen.
- `Private player`: the player whose private hand and tickets are currently visible.

In local pass-and-play, `active player` and `private player` are usually the same after the handoff shield clears. In online multiplayer, they can differ: it may be another player's turn while the viewer still sees only their own hand and tickets.

## Layout Intent

Use an immersive composition:

- Center: the board and basemap stay dominant.
- Top edge: table state, turn state, timer, utility actions.
- Bottom edge: private hand and private tickets.
- Right edge: route/station inspector, market/deck, ticket action, contextual decisions.
- Left edge: compact player roster and future communication reservations.
- Floating layer: notifications, warnings, ticket previews, endgame summary.

Avoid the current feeling of equal-weight panels around the map. The map should remain visible during every meaningful decision, especially ticket keeping and route inspection.

Basemap direction:
- Basemaps can be produced later as standalone board art and embedded into the board stage.
- A basemap can be specific to a map locale.
- It can use station positions as anchors and place local landmarks between stations/routes.
- Phase 1 should not overbuild basemap tooling. Keep a placeholder/background layer that can later accept custom art.

## Visual Language Path

Goal:
- move the active game board away from a polished dark web dashboard and toward an immersive tabletop game surface
- preserve the current layout architecture while changing the material language of the HUD pieces
- keep all gameplay controls stable, readable, and deterministic

Items:
- **Physical board pieces, not web panels**
  - reduce repeated generic rounded cards
  - make outer modules feel like board-edge instruments: ticket wallets, card racks, metal labels, and compact wooden scoring rails

- **Material hierarchy**
  - keep the map as the main stage
  - use warm paper, ink, aged brass, dark wood, and subtle grain for hand, tickets, market, and action surfaces
  - reduce glassmorphism, dashboard glow, and identical dark-blue panels

- **Card slot language**
  - make Hand and Market feel like train-card racks or punched ticket inventories instead of generic color tiles
  - render counts as printed stamps or punched tokens instead of glowing center dots
  - use route colors as enamel insets or card bands, not only circular badges

- **Right rail tab spine**
  - make Market, Build, and Chat feel like physical side tabs or drawer ears
  - active tab should look like a pulled-out paper/brass label rather than a standard web tab

Critique items to resolve:
- **P1: Too many identical rounded rectangles**
  - unified large radii create an AI/card-grid feeling
  - target shape language: outer modules 10-12px, card racks 6-8px, tickets 3-6px, tabs as cut labels or paper tags

- **P1: Right rail still reads like web UI**
  - tabs, buttons, and cards all look like dashboard controls
  - target treatment: a physical sidebar spine with inserted trays

- **P1: Market/Hand cards lack tactile identity**
  - current cards are legible but generic
  - target treatment: fixed train-card racks with printed count stamps while preserving count stability

- **P2: Material palette is too uniform**
  - the board uses too much dark glass
  - target palette: warm paper, aged brass, inked borders, dark wood, and subtle grain

- **P2: Typography is readable but not game-native**
  - text is clear but still app-like
  - target type treatment: printed-ticket small caps for labels, station-sign/enamel plaque treatment for primary actions, tabular printed numerals for counts

## Component Inventory

### 1. Board Stage

Purpose:
- render board, basemap, map name, config identity, route claims, stations, route hit targets, station hit targets
- support hover/click selection
- support ticket endpoint highlighting
- reserve route/station focus and fit-to-board controls as future placeholders

Contains:
- `BoardMap`
- map name / board snapshot label
- selected route/station state
- hover highlight state
- zoom/focus placeholder only; no real zoom controls in the first revamp pass
- optional board legend only if route colors need explanation
- basemap placeholder layer for future locale-specific art and landmarks

Confirmed:
- Map identity belongs inside the Board Stage, not top chrome. This keeps the top HUD simpler.
- Zoom controls do not ship in Phase 1. Reserve the slot only.

### 2. Table HUD

Purpose:
- show public game status without becoming a dashboard.

Contains:
- active player name and color
- turn phase: initial tickets, main turn, ticket choice, handoff, game over
- timer if enabled, placed near the active player
- final round warning

Does not contain:
- hand count
- private ticket details
- private hand details
- latest move summary

Confirmed:
- Latest move belongs in notification feedback, not the Table HUD.
- If a timer falls below 10 seconds, show a notification/reminder only for the player who needs to act.
- Timer should sit near the active player instead of becoming a separate central object.

### 3. Player Roster

Purpose:
- show public opponent and table status.

Contains per player:
- color
- name
- remaining trains
- remaining stations
- ticket count
- active-turn marker

Does not contain:
- score during active gameplay
- latest move marker
- hand count
- private cards
- private ticket endpoints

Confirmed:
- Do not show card-in-hand count.
- Do not show latest move in the roster.
- Do not show score during active gameplay; scoring can stay in guide/endgame or a later optional view.
- On desktop/fullscreen, roster can stay permanent.
- On narrow screens, roster can collapse.

### 4. Private Hand Rail

Purpose:
- show the private player's build cards in a stable, fixed-slot control rail.

Contains:
- one fixed slot per train card color
- count per color, displayed in the center of the color slot/card
- locomotive slot
- zero-count placeholders as dashed empty color slots
- selected payment preview when claiming a route or building a station

Behavior:
- drawing cards increments counts inside existing slots
- layout never grows or reflows because of card draws
- payment selection highlights matching slot and projected remaining count

Confirmed:
- Show counts by color, not individual cards.
- Each color has a fixed slot.
- Empty colors stay visible as dashed placeholders labeled with the color name.

### 5. Market And Deck

Purpose:
- show public card supply and draw actions.

Contains:
- fixed 5 market slots
- draw-from-deck action
- deck count
- locomotive draw warning if current rules make it special

Merge candidate:
- Can merge into `Supply Dock` with ticket draw controls if right-edge space is tight.

Confirmed:
- Do not show discard or reshuffle state in the first revamp pass.
- Prefer placing market/deck near the route/station inspector so draw/build decisions live in one action area.

### 6. Ticket Dock

Purpose:
- show private tickets on hand and ticket progress without blocking the board.

Contains:
- pending/connected status
- route title
- points
- origin/destination hover highlight
- connected path hint if available
- failed-risk styling near endgame

Behavior:
- hover/click highlights endpoints on the Board Stage
- selected ticket can pin endpoints until dismissed
- fixed-height ticket dock; overflow scrolls vertically
- connected tickets remain available but sit lower in the list and may use a collapsed/compact treatment

Confirmed:
- Ticket Dock should live near the private hand rail because both are private player information.
- Show all tickets, but give connected tickets a lower-priority placement/treatment.
- The dock size is fixed. If there are many tickets, scroll inside the dock.

### 7. Ticket Choice Sheet

Purpose:
- choose newly drawn tickets while keeping the map visible.

Contains:
- drawn ticket list
- selected count
- minimum keep rule
- confirm action
- endpoint highlight on hover/focus
- ticket points and route title

Behavior:
- appears as side drawer or bottom sheet, not centered modal
- does not cover key map stations/routes needed for the decision
- supports hover/focus map highlight

Needs confirmation:
- Prefer right-side drawer, bottom sheet, or adaptive: drawer on desktop, bottom sheet on narrow screens?
- Should the board dim during private ticket choice, or remain fully readable?

### 8. Inspector And Action Dock

Purpose:
- turn board selection into clear legal actions.

Contains for route:
- origin and destination
- length
- route color/type
- owner or unclaimed state
- tunnel/ferry/special requirements if present
- legal payment colors
- payment preview
- illegal action reason

Contains for station:
- station name
- current station owner if any
- build cost
- legal payment colors
- short optional place/route flavor, static and minimal

Merge candidate:
- Route/station info and action controls should be one component family, not separate info board plus action rail.

Confirmed:
- Do not require claim/build confirmation in the first revamp pass.
- Story/flavor starts minimal and static. It must not slow action clarity.

### 9. Activity Feed And Notifications

Purpose:
- record what just happened and surface urgent table events.

Contains:
- latest move notifications
- route claimed
- cards drawn
- tickets drawn/kept
- station built
- final round triggered
- player joined/left/reconnected
- action errors

Behavior:
- notifications appear near the center of the screen, then slide in a pipe-like flow and fade out
- simultaneous notifications stack into the same flow without overlap
- the flow may move upward or downward, but it should feel like one channel
- no persistent activity feed in the first revamp pass

Merge candidate:
- Future activity log can reuse notification event data, but it is not part of the first revamp pass.

### 10. Utility Chrome

Purpose:
- low-frequency commands and reference material.

Contains:
- scoring guide
- rulebook / guide
- leave game action, using either text or an `X` icon depending on context
- room/session metadata
- reconnect/session status

Behavior:
- clicking leave opens a confirmation pop-up: cancel or leave.

Confirmed:
- Normalize exit behavior around one leave-game action instead of multiple labels such as `Back to setup` and `Leave room`.

### 11. Endgame Summary

Purpose:
- make game over readable, satisfying, and shareable.

Contains:
- winner
- final ranking
- score breakdown: routes, tickets, stations/bonuses, penalties if any
- completed and missed tickets
- play again
- leave game
- reserved share action

Behavior:
- should feel like a game result layer over the board, not a generic results table

Confirmed:
- Social sharing is reserved for a later step. Keep a placeholder action only.

### 12. Future Communication Dock

Purpose:
- reserve space for later multiplayer communication without redesigning the shell.

Contains:
- in-game chat placeholder
- human-agent interaction room placeholder
- system/player messages if agents are seated later

Confirmed:
- These are layout reservations only for now. Do not add visible disabled components in the first revamp pass.

## Proposed Component Merges

Use fewer larger gameplay instruments:

1. `BoardStage`
   - merges board, basemap placeholder, map label, route/station interactions, ticket highlights, future zoom/focus placeholder

2. `TableHUD`
   - merges active turn, phase, timer, final-round warning

3. `PlayerRoster`
   - replaces current large table-status panel with compact public player rows

4. `PrivateRail`
   - merges fixed color hand slots and selected payment preview

5. `SupplyDock`
   - merges market, deck draw, ticket draw entry if confirmed

6. `TicketDock`
   - merges tickets on hand, pending/connected state, fixed scroll area, hover/click highlight

7. `TicketChoiceSheet`
   - replaces centered ticket picker modal for gameplay ticket choices

8. `InspectorDock`
   - merges route detail, station detail, legal action choices, illegal reasons, minimal static flavor

9. `ActivityLayer`
   - handles transient pipe-style notifications only

10. `GameOverLayer`
   - merges final scoreboard, breakdown, replay/leave/share actions

## Open Decisions

Must confirm before implementation:

1. Ticket choice placement: right drawer vs bottom sheet vs responsive hybrid.
2. Ticket choice map treatment: dim board vs keep board fully readable.
3. Market placement final check after first visual prototype: near inspector is preferred, but adjust if playtest shows it belongs nearer the hand rail.
4. Scoring guide treatment: popover, side reference, or full overlay.

## Implementation Progress

Current branch progress:

- Phase 1: component boundaries introduced for local and multiplayer active-game shells.
- Phase 2: private hand uses fixed color-count slots; market uses a fixed supply dock; discard/reshuffle remains out of scope.
- Phase 3: ticket choice uses a non-centered sheet, ticket hover/focus highlights map endpoints, and ticket dock rows can pin endpoint focus.
- Phase 4: route/station inspector remains one-step, with illegal reasons preserved and payment preview wired into the private hand rail.
- Phase 5: wide gameplay layout uses left public/private rail, center board stage, and right supply/inspector rail; narrower screens fall back to stacked layout.
- Phase 6: transient notification pipe is wired for completed local/multiplayer activity, timer warnings, final-round alerts, and game-over arrival.
- Phase 6: game over now uses a board-overlay result layer with score breakdown cards plus reserved share/replay/leave actions.
- Phase 7: active-game shell is rethemed toward setup-page station enamel plus a darker game-HUD feel while keeping the board stage readable.
- Phase 7: table status moved into the top utility row, private hand/tickets own the left rail, and the right rail is now a tabbed market/inspector/chat module.
- Phase 7: Board Stage no longer displays map/config identity or focus-control placeholder during active play; the map can scale to the available center width without horizontal board scrolling.
- Phase 7: top table status is simplified into four fixed player slots, with empty-seat placeholders, red active-player outline, and reserved two-digit timer badge support.
- Phase 7: inspector header chrome is reduced; right-side tabs use vertical labels, the panel keeps fixed height, and overflowing content scrolls inside the module.
- Phase 7: draw-card notifications now key off newly appended log entries instead of log text, so two identical draw messages still surface independently.
- Phase 7: ticket dock uses unfinished-first ordering with four-ticket pages and arrow navigation instead of vertical scrolling.
- Phase 7: draw-ticket action moved to the top utility row before scoring; market rail tightened to compact single-slot height.
- Phase 7: board map now fills the remaining fixed viewport stage, so larger displays can show a larger board without creating page-level scroll.
- Phase 7: top player slots, ticket rows, pending labels, and market dock were tightened again to reduce chrome height and prevent ticket text overflow.
- Phase 7: market moved into the right rail as the first module; the old map-bottom market row is removed from both local and multiplayer gameplay.
- Phase 7: gameplay shell now uses a fixed viewport grid so the page itself does not scroll by default; left tickets and right rail stretch to the board stage height.
- Phase 7: player slots now keep full `trains` and `stations` labels while staying compact.
- Phase 7: market slots now use the same fixed color-count card language as the private hand, and payment spend badges are absolutely placed so route-payment preview does not change hand slot height.
- Phase 7: right rail tabs are functional for `Market` and reserved `Chat`; the old disabled `Inspector` tab is removed.
- Phase 7: action errors now surface through transient notifications instead of occupying the right rail content area.
- Phase 7: ticket rows and draw-ticket choices share one compact ticket row visual language; ticket progress meta sits below the `Tickets` label.
- Phase 7: temporary basemap treatment moves from solid warm yellow toward a white glass placeholder until custom basemap artwork exists.
- Phase 7: player roster moved above the board stage so the four player slots share the board width; the top-left chrome now carries the Hudson Hustle brand.
- Phase 7: right rail now has vertical `Market`, `Build`, and `Chat` tabs. Selecting a route or city switches the rail to `Build`.
- Phase 7: `Draw tickets` moved into the Market rail below `Draw from deck`, and the ticket choice sheet was reduced to a right-rail-width drawer.
- Phase 7: multiplayer chat MVP added through room socket messages with an in-memory recent-message buffer.

Still deferred:

- visible chat or human-agent UI
- final scoring-guide treatment
- full browser QA pass across narrow and desktop widths

## Implementation Phases

### Phase 0: Alignment Document

Output:
- this document
- confirmed component inventory
- confirmed merge map

No code changes except docs.

### Phase 1: Gameplay Information Architecture

Goal:
- create the new component boundaries without changing game rules.

Work:
- introduce component shells for `BoardStage`, `TableHUD`, `PlayerRoster`, `PrivateRail`, `SupplyDock`, `TicketDock`, and `InspectorDock`
- keep existing game actions wired through the same state/actions
- remove hand count from public table status
- remove active-game score from the public roster
- rename active/private/viewer concepts in UI code where needed
- keep basemap as a replaceable placeholder layer

Verification:
- local play still supports initial tickets, main turn, card draw, route claim, station build, game over
- no gameplay behavior changes

### Phase 2: Fixed Inventory And Supply Rails

Goal:
- stabilize hand and market layout.

Work:
- convert active private hand to fixed color slots with counts
- convert market to fixed supply slots
- add deck count and relevant disabled states
- add payment preview state inside hand rail
- keep discard/reshuffle out of the first pass

Verification:
- card draws do not change rail dimensions
- route claim payment options match current rules

### Phase 3: Ticket UX Without Blocking Map

Goal:
- make ticket decisions map-aware.

Work:
- replace centered ticket choice modal with `TicketChoiceSheet`
- implement ticket hover/focus endpoint highlights
- add ticket-on-hand hover/click endpoint highlights
- support pinned ticket focus

Verification:
- players can inspect all candidate ticket endpoints while the sheet is open
- map remains readable during ticket choice

### Phase 4: Inspector And Action Dock

Goal:
- make route/station decisions feel like one authored gameplay instrument.

Work:
- combine info board and action rail into `InspectorDock`
- add payment preview and illegal reason states
- keep claim/build one-step in the first pass
- add optional static flavor slot with strict density limits

Verification:
- route and station interactions remain deterministic
- no UI change silently changes legal action rules

### Phase 5: Immersive HUD Composition

Goal:
- move from panel layout to edge-mounted immersive layout.

Work:
- rebuild active game layout around center board plus edge HUD zones
- adapt local and multiplayer shells together
- add responsive collapse rules
- keep map dominant at desktop and laptop widths

Verification:
- browser smoke at desktop and narrow widths
- map remains usable with all major overlays open

### Phase 6: Activity, Endgame, And Future Slots

Goal:
- complete game-flow layers.

Work:
- implement `ActivityLayer`
- implement stronger `GameOverLayer`
- reserve non-visible layout space for chat and human-agent interaction
- align rulebook/scoring/leave-room chrome

Verification:
- game-over score breakdown remains accurate
- activity events reflect completed actions only

### Phase 7: Polish And Docs

Goal:
- freeze the new gameplay shell.

Work:
- update `docs/gameplay/player-guide.md` if behavior or visible flow changed
- update component-system docs with stable component families
- run focused browser QA
- run targeted tests if rules were touched

Verification:
- visual pass for overlap, text fit, and map occlusion
- no docs mismatch for player-facing flow
