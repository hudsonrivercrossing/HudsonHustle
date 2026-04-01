Map: Hudson Hustle Anchor Prototype (20 cities, 32 routes, 33 tickets)
Setup: 2-player self-play, personas = central optimizer vs outer opportunist

Setup | Blue (central optimizer)
Pending: t-newark-downtown-brooklyn, t-grand-central-flushing, t-world-trade-downtown-brooklyn, t-atlantic-terminal-jamaica
Keeps: t-newark-downtown-brooklyn, t-grand-central-flushing, t-world-trade-downtown-brooklyn, t-atlantic-terminal-jamaica
Tickets locked. Phase=initialTickets

Setup | Red (outer opportunist)
Pending: t-secaucus-jamaica, t-exchange-place-downtown-brooklyn, t-chelsea-world-trade, t-hoboken-chelsea
Keeps: t-secaucus-jamaica, t-exchange-place-downtown-brooklyn, t-chelsea-world-trade, t-hoboken-chelsea
Tickets locked. Phase=main

Turn 1 | Blue (central optimizer)
Snapshot: strongest=t-newark-downtown-brooklyn weakest=t-atlantic-terminal-jamaica completed=0 incomplete=4
Plan: newark-penn -> downtown-brooklyn | Risk: Exchange Pl. -> World Trade | Threat: Hudson Yds. -> Grand Central
Hand before: cri:0 amb:0 eme:1 cob:1 vio:0 obs:0 ivo:1 ros:0 loco:1 | tickets=4 trains=24 stations=3
Action: claim exchange-place-world-trade-a with emerald | Why: best route-progress move right now. | Result: failed claim / tunnel surcharge or affordability blocked exchange-place-world-trade-a. | Reveal: locomotive, cobalt, rose
Hand after: cri:0 amb:0 eme:1 cob:1 vio:0 obs:0 ivo:1 ros:0 loco:1 | score=0 trains=24
Safety: completed=none | fallback=atlantic-terminal -> jamaica
New weakness: outer branches can now press the central spine.

Turn 2 | Red (outer opportunist)
Snapshot: strongest=t-secaucus-jamaica weakest=t-chelsea-world-trade completed=0 incomplete=4
Plan: secaucus -> jamaica | Risk: no claimable route | Threat: Penn Dist. -> Chelsea
Hand before: cri:1 amb:1 eme:1 cob:0 vio:1 obs:0 ivo:0 ros:0 loco:0 | tickets=4 trains=24 stations=3
Action: draw card from deck | Second draw: market[1] | Why: building toward Exchange Pl. -> World Trade rather than over-drawing tickets.
Hand after: cri:3 amb:1 eme:1 cob:0 vio:1 obs:0 ivo:0 ros:0 loco:0 | score=0 trains=24
Safety: completed=none | fallback=chelsea -> world-trade
New weakness: the center can still outscore if left uncontested.

Turn 3 | Blue (central optimizer)
Snapshot: strongest=t-newark-downtown-brooklyn weakest=t-atlantic-terminal-jamaica completed=0 incomplete=4
Plan: newark-penn -> downtown-brooklyn | Risk: Atlantic Term. -> Jamaica | Threat: Hudson Yds. -> Grand Central
Hand before: cri:0 amb:0 eme:1 cob:1 vio:0 obs:0 ivo:1 ros:0 loco:1 | tickets=4 trains=24 stations=3
Action: claim atlantic-terminal-jamaica with cobalt | Why: 1 ticket(s) complete if claimed. | Result: success (score updated)
Hand after: cri:0 amb:0 eme:1 cob:0 vio:0 obs:0 ivo:1 ros:0 loco:0 | score=2 trains=22
Safety: completed=t-atlantic-terminal-jamaica | fallback=atlantic-terminal -> jamaica
New weakness: outer branches can now press the central spine.

Turn 4 | Red (outer opportunist)
Snapshot: strongest=t-secaucus-jamaica weakest=t-chelsea-world-trade completed=0 incomplete=4
Plan: secaucus -> jamaica | Risk: Exchange Pl. -> World Trade | Threat: Grand Central -> Jamaica
Hand before: cri:3 amb:1 eme:1 cob:0 vio:1 obs:0 ivo:0 ros:0 loco:0 | tickets=4 trains=24 stations=3
Action: claim exchange-place-world-trade-a with crimson | Why: best route-progress move right now. | Result: success (score updated)
Hand after: cri:1 amb:1 eme:1 cob:0 vio:1 obs:0 ivo:0 ros:0 loco:0 | score=2 trains=22
Safety: completed=none | fallback=chelsea -> world-trade
New weakness: the center can still outscore if left uncontested.

Turn 5 | Blue (central optimizer)
Snapshot: strongest=t-newark-downtown-brooklyn weakest=t-atlantic-terminal-jamaica completed=1 incomplete=3
Plan: newark-penn -> downtown-brooklyn | Risk: no claimable route | Threat: Chelsea -> World Trade
Hand before: cri:0 amb:0 eme:1 cob:0 vio:0 obs:0 ivo:1 ros:0 loco:0 | tickets=4 trains=22 stations=3
Action: draw card from deck | Second draw: deck | Why: no claimable route yet; kept tempo with cards.
Hand after: cri:0 amb:1 eme:1 cob:1 vio:0 obs:0 ivo:1 ros:0 loco:0 | score=2 trains=22
Safety: completed=t-atlantic-terminal-jamaica | fallback=atlantic-terminal -> jamaica
New weakness: outer branches can now press the central spine.

Turn 6 | Red (outer opportunist)
Snapshot: strongest=t-secaucus-jamaica weakest=t-chelsea-world-trade completed=0 incomplete=4
Plan: secaucus -> jamaica | Risk: no claimable route | Threat: Grand Central -> Jamaica
Hand before: cri:1 amb:1 eme:1 cob:0 vio:1 obs:0 ivo:0 ros:0 loco:0 | tickets=4 trains=22 stations=3
Action: draw card from deck | Second draw: market[3] | Why: building toward Hoboken -> Grove St rather than over-drawing tickets.
Hand after: cri:1 amb:1 eme:3 cob:0 vio:1 obs:0 ivo:0 ros:0 loco:0 | score=2 trains=22
Safety: completed=none | fallback=chelsea -> world-trade
New weakness: the center can still outscore if left uncontested.

Turn 7 | Blue (central optimizer)
Snapshot: strongest=t-newark-downtown-brooklyn weakest=t-atlantic-terminal-jamaica completed=1 incomplete=3
Plan: newark-penn -> downtown-brooklyn | Risk: no claimable route | Threat: Chelsea -> World Trade
Hand before: cri:0 amb:1 eme:1 cob:1 vio:0 obs:0 ivo:1 ros:0 loco:0 | tickets=4 trains=22 stations=3
Action: draw card from deck | Second draw: deck | Why: no claimable route yet; kept tempo with cards.
Hand after: cri:0 amb:1 eme:1 cob:1 vio:1 obs:0 ivo:1 ros:1 loco:0 | score=2 trains=22
Safety: completed=t-atlantic-terminal-jamaica | fallback=atlantic-terminal -> jamaica
New weakness: outer branches can now press the central spine.

Turn 8 | Red (outer opportunist)
Snapshot: strongest=t-secaucus-jamaica weakest=t-chelsea-world-trade completed=0 incomplete=4
Plan: secaucus -> jamaica | Risk: Hoboken -> Grove St | Threat: Grand Central -> Jamaica
Hand before: cri:1 amb:1 eme:3 cob:0 vio:1 obs:0 ivo:0 ros:0 loco:0 | tickets=4 trains=22 stations=3
Action: draw card from market[1] | Why: the first draw ended the turn.
Hand after: cri:1 amb:1 eme:3 cob:0 vio:1 obs:0 ivo:0 ros:0 loco:1 | score=2 trains=22
Safety: completed=none | fallback=chelsea -> world-trade
New weakness: the center can still outscore if left uncontested.

Turn 9 | Blue (central optimizer)
Snapshot: strongest=t-newark-downtown-brooklyn weakest=t-atlantic-terminal-jamaica completed=1 incomplete=3
Plan: newark-penn -> downtown-brooklyn | Risk: no claimable route | Threat: Chelsea -> World Trade
Hand before: cri:0 amb:1 eme:1 cob:1 vio:1 obs:0 ivo:1 ros:1 loco:0 | tickets=4 trains=22 stations=3
Action: draw card from deck | Second draw: deck | Why: no claimable route yet; kept tempo with cards.
Hand after: cri:0 amb:1 eme:2 cob:1 vio:1 obs:1 ivo:1 ros:1 loco:0 | score=2 trains=22
Safety: completed=t-atlantic-terminal-jamaica | fallback=atlantic-terminal -> jamaica
New weakness: outer branches can now press the central spine.

Turn 10 | Red (outer opportunist)
Snapshot: strongest=t-secaucus-jamaica weakest=t-chelsea-world-trade completed=0 incomplete=4
Plan: secaucus -> jamaica | Risk: World Trade -> Battery Pk. | Threat: Grand Central -> Jamaica
Hand before: cri:1 amb:1 eme:3 cob:0 vio:1 obs:0 ivo:0 ros:0 loco:1 | tickets=4 trains=22 stations=3
Action: claim world-trade-battery-park with amber | Why: best route-progress move right now. | Result: success (score updated)
Hand after: cri:1 amb:0 eme:3 cob:0 vio:1 obs:0 ivo:0 ros:0 loco:0 | score=4 trains=20
Safety: completed=none | fallback=chelsea -> world-trade
New weakness: the center can still outscore if left uncontested.

Turn 11 | Blue (central optimizer)
Snapshot: strongest=t-newark-downtown-brooklyn weakest=t-atlantic-terminal-jamaica completed=1 incomplete=3
Plan: newark-penn -> downtown-brooklyn | Risk: Williamsburg -> Downtown Bklyn | Threat: Battery Pk. -> Red Hook
Hand before: cri:0 amb:1 eme:2 cob:1 vio:1 obs:1 ivo:1 ros:1 loco:0 | tickets=4 trains=22 stations=3
Action: claim williamsburg-downtown-brooklyn with emerald | Why: 1 ticket(s) complete if claimed. | Result: success (score updated)
Hand after: cri:0 amb:1 eme:0 cob:1 vio:1 obs:1 ivo:1 ros:1 loco:0 | score=4 trains=20
Safety: completed=t-atlantic-terminal-jamaica | fallback=atlantic-terminal -> jamaica
New weakness: outer branches can now press the central spine.

Turn 12 | Red (outer opportunist)
Snapshot: strongest=t-secaucus-jamaica weakest=t-chelsea-world-trade completed=0 incomplete=4
Plan: secaucus -> jamaica | Risk: Union Sq. -> Battery Pk. | Threat: Union Sq. -> Williamsburg
Hand before: cri:1 amb:0 eme:3 cob:0 vio:1 obs:0 ivo:0 ros:0 loco:0 | tickets=4 trains=20 stations=3
Action: draw card from market[1] | Why: the first draw ended the turn.
Hand after: cri:1 amb:0 eme:3 cob:0 vio:1 obs:0 ivo:0 ros:0 loco:1 | score=4 trains=20
Safety: completed=none | fallback=chelsea -> world-trade
New weakness: the center can still outscore if left uncontested.

Turn 13 | Blue (central optimizer)
Snapshot: strongest=t-newark-downtown-brooklyn weakest=t-atlantic-terminal-jamaica completed=1 incomplete=3
Plan: newark-penn -> downtown-brooklyn | Risk: no claimable route | Threat: Battery Pk. -> Red Hook
Hand before: cri:0 amb:1 eme:0 cob:1 vio:1 obs:1 ivo:1 ros:1 loco:0 | tickets=4 trains=20 stations=3
Action: draw card from deck | Second draw: deck | Why: no claimable route yet; kept tempo with cards.
Hand after: cri:0 amb:2 eme:1 cob:1 vio:1 obs:1 ivo:1 ros:1 loco:0 | score=4 trains=20
Safety: completed=t-atlantic-terminal-jamaica | fallback=atlantic-terminal -> jamaica
New weakness: outer branches can now press the central spine.

Turn 14 | Red (outer opportunist)
Snapshot: strongest=t-secaucus-jamaica weakest=t-chelsea-world-trade completed=0 incomplete=4
Plan: secaucus -> jamaica | Risk: Battery Pk. -> Downtown Bklyn | Threat: Union Sq. -> Williamsburg
Hand before: cri:1 amb:0 eme:3 cob:0 vio:1 obs:0 ivo:0 ros:0 loco:1 | tickets=4 trains=20 stations=3
Action: claim battery-park-downtown-brooklyn with crimson | Why: 1 ticket(s) complete if claimed. | Result: failed claim / tunnel surcharge or affordability blocked battery-park-downtown-brooklyn. | Reveal: locomotive, locomotive, amber
Hand after: cri:1 amb:0 eme:3 cob:0 vio:1 obs:0 ivo:0 ros:0 loco:1 | score=4 trains=20
Safety: completed=none | fallback=chelsea -> world-trade
New weakness: the center can still outscore if left uncontested.

Turn 15 | Blue (central optimizer)
Snapshot: strongest=t-newark-downtown-brooklyn weakest=t-atlantic-terminal-jamaica completed=1 incomplete=3
Plan: newark-penn -> downtown-brooklyn | Risk: Penn Dist. -> Chelsea | Threat: Battery Pk. -> Red Hook
Hand before: cri:0 amb:2 eme:1 cob:1 vio:1 obs:1 ivo:1 ros:1 loco:0 | tickets=4 trains=20 stations=3
Action: claim midtown-west-chelsea with amber | Why: 1 ticket(s) complete if claimed. | Result: success (score updated)
Hand after: cri:0 amb:0 eme:1 cob:1 vio:1 obs:1 ivo:1 ros:1 loco:0 | score=6 trains=18
Safety: completed=t-atlantic-terminal-jamaica | fallback=atlantic-terminal -> jamaica
New weakness: outer branches can now press the central spine.

Turn 16 | Red (outer opportunist)
Snapshot: strongest=t-secaucus-jamaica weakest=t-chelsea-world-trade completed=0 incomplete=4
Plan: secaucus -> jamaica | Risk: Battery Pk. -> Red Hook | Threat: Chelsea -> World Trade
Hand before: cri:1 amb:0 eme:3 cob:0 vio:1 obs:0 ivo:0 ros:0 loco:1 | tickets=4 trains=20 stations=3
Action: claim battery-park-red-hook with emerald | Why: best route-progress move right now. | Result: success (score updated)
Hand after: cri:1 amb:0 eme:2 cob:0 vio:1 obs:0 ivo:0 ros:0 loco:0 | score=6 trains=18
Safety: completed=none | fallback=chelsea -> world-trade
New weakness: the center can still outscore if left uncontested.

Turn 17 | Blue (central optimizer)
Snapshot: strongest=t-newark-downtown-brooklyn weakest=t-atlantic-terminal-jamaica completed=1 incomplete=3
Plan: newark-penn -> downtown-brooklyn | Risk: no claimable route | Threat: Chelsea -> World Trade
Hand before: cri:0 amb:0 eme:1 cob:1 vio:1 obs:1 ivo:1 ros:1 loco:0 | tickets=4 trains=18 stations=3
Action: draw card from deck | Second draw: deck | Why: building toward Chelsea -> Union Sq. rather than over-drawing tickets.
Hand after: cri:0 amb:0 eme:1 cob:1 vio:3 obs:1 ivo:1 ros:1 loco:0 | score=6 trains=18
Safety: completed=t-atlantic-terminal-jamaica | fallback=atlantic-terminal -> jamaica
New weakness: outer branches can now press the central spine.

Turn 18 | Red (outer opportunist)
Snapshot: strongest=t-secaucus-jamaica weakest=t-chelsea-world-trade completed=0 incomplete=4
Plan: secaucus -> jamaica | Risk: Hoboken -> Grove St | Threat: Chelsea -> World Trade
Hand before: cri:1 amb:0 eme:2 cob:0 vio:1 obs:0 ivo:0 ros:0 loco:0 | tickets=4 trains=18 stations=3
Action: draw card from deck | Second draw: deck | Why: building toward Hoboken -> Grove St rather than over-drawing tickets.
Hand after: cri:1 amb:0 eme:2 cob:0 vio:2 obs:0 ivo:1 ros:0 loco:0 | score=6 trains=18
Safety: completed=none | fallback=chelsea -> world-trade
New weakness: the center can still outscore if left uncontested.

Turn 19 | Blue (central optimizer)
Snapshot: strongest=t-newark-downtown-brooklyn weakest=t-atlantic-terminal-jamaica completed=1 incomplete=3
Plan: newark-penn -> downtown-brooklyn | Risk: Penn Dist. -> Long Isl. City | Threat: Chelsea -> World Trade
Hand before: cri:0 amb:0 eme:1 cob:1 vio:3 obs:1 ivo:1 ros:1 loco:0 | tickets=4 trains=18 stations=3
Action: claim midtown-west-long-island-city with violet | Why: 1 ticket(s) complete if claimed. | Result: success (score updated)
Hand after: cri:0 amb:0 eme:1 cob:1 vio:0 obs:1 ivo:1 ros:1 loco:0 | score=10 trains=15
Safety: completed=t-atlantic-terminal-jamaica | fallback=atlantic-terminal -> jamaica
New weakness: outer branches can now press the central spine.

Turn 20 | Red (outer opportunist)
Snapshot: strongest=t-secaucus-jamaica weakest=t-chelsea-world-trade completed=0 incomplete=4
Plan: secaucus -> jamaica | Risk: Hoboken -> Grove St | Threat: Chelsea -> World Trade
Hand before: cri:1 amb:0 eme:2 cob:0 vio:2 obs:0 ivo:1 ros:0 loco:0 | tickets=4 trains=18 stations=3
Action: draw card from deck | Second draw: deck | Why: building toward Union Sq. -> Battery Pk. rather than over-drawing tickets.
Hand after: cri:1 amb:0 eme:2 cob:0 vio:2 obs:1 ivo:1 ros:0 loco:1 | score=6 trains=18
Safety: completed=none | fallback=chelsea -> world-trade
New weakness: the center can still outscore if left uncontested.

Turn 21 | Blue (central optimizer)
Snapshot: strongest=t-newark-downtown-brooklyn weakest=t-atlantic-terminal-jamaica completed=1 incomplete=3
Plan: newark-penn -> downtown-brooklyn | Risk: no claimable route | Threat: Chelsea -> World Trade
Hand before: cri:0 amb:0 eme:1 cob:1 vio:0 obs:1 ivo:1 ros:1 loco:0 | tickets=4 trains=15 stations=3
Action: draw card from deck | Second draw: deck | Why: no claimable route yet; kept tempo with cards.
Hand after: cri:0 amb:0 eme:1 cob:1 vio:2 obs:1 ivo:1 ros:1 loco:0 | score=10 trains=15
Safety: completed=t-atlantic-terminal-jamaica | fallback=atlantic-terminal -> jamaica
New weakness: outer branches can now press the central spine.

Turn 22 | Red (outer opportunist)
Snapshot: strongest=t-secaucus-jamaica weakest=t-chelsea-world-trade completed=0 incomplete=4
Plan: secaucus -> jamaica | Risk: Red Hook -> Atlantic Term. | Threat: Chelsea -> World Trade
Hand before: cri:1 amb:0 eme:2 cob:0 vio:2 obs:1 ivo:1 ros:0 loco:1 | tickets=4 trains=18 stations=3
Action: claim red-hook-atlantic-terminal with obsidian | Why: best route-progress move right now. | Result: success (score updated)
Hand after: cri:1 amb:0 eme:2 cob:0 vio:2 obs:0 ivo:1 ros:0 loco:0 | score=8 trains=16
Safety: completed=none | fallback=chelsea -> world-trade
New weakness: the center can still outscore if left uncontested.

Turn 23 | Blue (central optimizer)
Snapshot: strongest=t-newark-downtown-brooklyn weakest=t-atlantic-terminal-jamaica completed=1 incomplete=3
Plan: newark-penn -> downtown-brooklyn | Risk: Chelsea -> Union Sq. | Threat: Chelsea -> World Trade
Hand before: cri:0 amb:0 eme:1 cob:1 vio:2 obs:1 ivo:1 ros:1 loco:0 | tickets=4 trains=15 stations=3
Action: claim chelsea-union-square with violet | Why: 1 ticket(s) complete if claimed. | Result: success (score updated)
Hand after: cri:0 amb:0 eme:1 cob:1 vio:0 obs:1 ivo:1 ros:1 loco:0 | score=12 trains=13
Safety: completed=t-atlantic-terminal-jamaica | fallback=atlantic-terminal -> jamaica
New weakness: outer branches can now press the central spine.

Turn 24 | Red (outer opportunist)
Snapshot: strongest=t-secaucus-jamaica weakest=t-chelsea-world-trade completed=0 incomplete=4
Plan: secaucus -> jamaica | Risk: Hoboken -> Grove St | Threat: Chelsea -> World Trade
Hand before: cri:1 amb:0 eme:2 cob:0 vio:2 obs:0 ivo:1 ros:0 loco:0 | tickets=4 trains=16 stations=3
Action: draw card from deck | Second draw: deck | Why: building toward Hoboken -> Grove St rather than over-drawing tickets.
Hand after: cri:1 amb:0 eme:2 cob:1 vio:2 obs:0 ivo:2 ros:0 loco:0 | score=8 trains=16
Safety: completed=none | fallback=chelsea -> world-trade
New weakness: the center can still outscore if left uncontested.

Turn 25 | Blue (central optimizer)
Snapshot: strongest=t-newark-downtown-brooklyn weakest=t-atlantic-terminal-jamaica completed=1 incomplete=3
Plan: newark-penn -> downtown-brooklyn | Risk: no claimable route | Threat: Chelsea -> World Trade
Hand before: cri:0 amb:0 eme:1 cob:1 vio:0 obs:1 ivo:1 ros:1 loco:0 | tickets=4 trains=13 stations=3
Action: draw card from deck | Second draw: deck | Why: no claimable route yet; kept tempo with cards.
Hand after: cri:1 amb:0 eme:1 cob:1 vio:0 obs:2 ivo:1 ros:1 loco:0 | score=12 trains=13
Safety: completed=t-atlantic-terminal-jamaica | fallback=atlantic-terminal -> jamaica
New weakness: outer branches can now press the central spine.

Turn 26 | Red (outer opportunist)
Snapshot: strongest=t-secaucus-jamaica weakest=t-chelsea-world-trade completed=0 incomplete=4
Plan: secaucus -> jamaica | Risk: Hoboken -> Grove St | Threat: Chelsea -> World Trade
Hand before: cri:1 amb:0 eme:2 cob:1 vio:2 obs:0 ivo:2 ros:0 loco:0 | tickets=4 trains=16 stations=3
Action: draw card from deck | Second draw: deck | Why: building toward Hoboken -> Grove St rather than over-drawing tickets.
Hand after: cri:1 amb:1 eme:2 cob:1 vio:2 obs:0 ivo:2 ros:1 loco:0 | score=8 trains=16
Safety: completed=none | fallback=chelsea -> world-trade
New weakness: the center can still outscore if left uncontested.

Turn 27 | Blue (central optimizer)
Snapshot: strongest=t-newark-downtown-brooklyn weakest=t-atlantic-terminal-jamaica completed=1 incomplete=3
Plan: newark-penn -> downtown-brooklyn | Risk: Newark Penn -> Grove St | Threat: Chelsea -> World Trade
Hand before: cri:1 amb:0 eme:1 cob:1 vio:0 obs:2 ivo:1 ros:1 loco:0 | tickets=4 trains=13 stations=3
Action: claim newark-penn-grove-st with obsidian | Why: 1 ticket(s) complete if claimed. | Result: success (score updated)
Hand after: cri:1 amb:0 eme:1 cob:1 vio:0 obs:0 ivo:1 ros:1 loco:0 | score=14 trains=11
Safety: completed=t-atlantic-terminal-jamaica | fallback=atlantic-terminal -> jamaica
New weakness: outer branches can now press the central spine.

Turn 28 | Red (outer opportunist)
Snapshot: strongest=t-secaucus-jamaica weakest=t-chelsea-world-trade completed=0 incomplete=4
Plan: secaucus -> jamaica | Risk: Hoboken -> Grove St | Threat: Chelsea -> World Trade
Hand before: cri:1 amb:1 eme:2 cob:1 vio:2 obs:0 ivo:2 ros:1 loco:0 | tickets=4 trains=16 stations=3
Action: draw card from deck | Second draw: deck | Why: building toward Hudson Yds. -> Grand Central rather than over-drawing tickets.
Hand after: cri:1 amb:2 eme:2 cob:1 vio:2 obs:0 ivo:3 ros:1 loco:0 | score=8 trains=16
Safety: completed=none | fallback=chelsea -> world-trade
New weakness: the center can still outscore if left uncontested.

Turn 29 | Blue (central optimizer)
Snapshot: strongest=t-newark-downtown-brooklyn weakest=t-atlantic-terminal-jamaica completed=1 incomplete=3
Plan: newark-penn -> downtown-brooklyn | Risk: no claimable route | Threat: Chelsea -> World Trade
Hand before: cri:1 amb:0 eme:1 cob:1 vio:0 obs:0 ivo:1 ros:1 loco:0 | tickets=4 trains=11 stations=3
Action: draw card from deck | Second draw: market[3] | Why: building toward Chelsea -> World Trade rather than over-drawing tickets.
Hand after: cri:1 amb:0 eme:1 cob:1 vio:0 obs:0 ivo:1 ros:3 loco:0 | score=14 trains=11
Safety: completed=t-atlantic-terminal-jamaica | fallback=atlantic-terminal -> jamaica
New weakness: outer branches can now press the central spine.

Turn 30 | Red (outer opportunist)
Snapshot: strongest=t-secaucus-jamaica weakest=t-chelsea-world-trade completed=0 incomplete=4
Plan: secaucus -> jamaica | Risk: Hoboken -> Chelsea | Threat: Chelsea -> World Trade
Hand before: cri:1 amb:2 eme:2 cob:1 vio:2 obs:0 ivo:3 ros:1 loco:0 | tickets=4 trains=16 stations=3
Action: claim hoboken-chelsea with ivory | Why: 1 ticket(s) complete if claimed. | Result: success (score updated)
Hand after: cri:1 amb:2 eme:2 cob:1 vio:2 obs:0 ivo:0 ros:1 loco:0 | score=12 trains=13
Safety: completed=t-hoboken-chelsea | fallback=chelsea -> world-trade
New weakness: the center can still outscore if left uncontested.

Turn 31 | Blue (central optimizer)
Snapshot: strongest=t-newark-downtown-brooklyn weakest=t-atlantic-terminal-jamaica completed=1 incomplete=3
Plan: newark-penn -> downtown-brooklyn | Risk: Chelsea -> World Trade | Threat: Hoboken -> Grove St
Hand before: cri:1 amb:0 eme:1 cob:1 vio:0 obs:0 ivo:1 ros:3 loco:0 | tickets=4 trains=11 stations=3
Action: claim chelsea-world-trade with rose | Why: 1 ticket(s) complete if claimed. | Result: success (score updated)
Hand after: cri:1 amb:0 eme:1 cob:1 vio:0 obs:0 ivo:1 ros:1 loco:0 | score=16 trains=9
Safety: completed=t-atlantic-terminal-jamaica | fallback=atlantic-terminal -> jamaica
New weakness: outer branches can now press the central spine.

Turn 32 | Red (outer opportunist)
Snapshot: strongest=t-secaucus-jamaica weakest=t-chelsea-world-trade completed=1 incomplete=3
Plan: secaucus -> jamaica | Risk: Hoboken -> Grove St | Threat: Union Sq. -> Battery Pk.
Hand before: cri:1 amb:2 eme:2 cob:1 vio:2 obs:0 ivo:0 ros:1 loco:0 | tickets=4 trains=13 stations=3
Action: claim hoboken-grove-st with emerald | Why: 1 ticket(s) complete if claimed. | Result: success (score updated)
Hand after: cri:1 amb:2 eme:0 cob:1 vio:2 obs:0 ivo:0 ros:1 loco:0 | score=14 trains=11
Safety: completed=t-hoboken-chelsea | fallback=chelsea -> world-trade
New weakness: the center can still outscore if left uncontested.

Turn 33 | Blue (central optimizer)
Snapshot: strongest=t-newark-downtown-brooklyn weakest=t-atlantic-terminal-jamaica completed=1 incomplete=3
Plan: newark-penn -> downtown-brooklyn | Risk: no claimable route | Threat: Union Sq. -> Battery Pk.
Hand before: cri:1 amb:0 eme:1 cob:1 vio:0 obs:0 ivo:1 ros:1 loco:0 | tickets=4 trains=9 stations=3
Action: draw card from deck | Second draw: deck | Why: building toward Long Isl. City -> Williamsburg rather than over-drawing tickets.
Hand after: cri:1 amb:0 eme:1 cob:1 vio:0 obs:1 ivo:1 ros:1 loco:1 | score=16 trains=9
Safety: completed=t-atlantic-terminal-jamaica | fallback=atlantic-terminal -> jamaica
New weakness: outer branches can now press the central spine.

Turn 34 | Red (outer opportunist)
Snapshot: strongest=t-secaucus-jamaica weakest=t-chelsea-world-trade completed=1 incomplete=3
Plan: secaucus -> jamaica | Risk: Secaucus -> Hoboken | Threat: Union Sq. -> Battery Pk.
Hand before: cri:1 amb:2 eme:0 cob:1 vio:2 obs:0 ivo:0 ros:1 loco:0 | tickets=4 trains=11 stations=3
Action: claim secaucus-hoboken with amber | Why: 1 ticket(s) complete if claimed. | Result: success (score updated)
Hand after: cri:1 amb:0 eme:0 cob:1 vio:2 obs:0 ivo:0 ros:1 loco:0 | score=16 trains=9
Safety: completed=t-hoboken-chelsea | fallback=chelsea -> world-trade
New weakness: the center can still outscore if left uncontested.

Turn 35 | Blue (central optimizer)
Snapshot: strongest=t-newark-downtown-brooklyn weakest=t-atlantic-terminal-jamaica completed=1 incomplete=3
Plan: newark-penn -> downtown-brooklyn | Risk: Long Isl. City -> Williamsburg | Threat: Union Sq. -> Battery Pk.
Hand before: cri:1 amb:0 eme:1 cob:1 vio:0 obs:1 ivo:1 ros:1 loco:1 | tickets=4 trains=9 stations=3
Action: claim long-island-city-williamsburg with emerald | Why: 2 ticket(s) complete if claimed. | Result: success (score updated)
Hand after: cri:1 amb:0 eme:0 cob:1 vio:0 obs:1 ivo:1 ros:1 loco:0 | score=18 trains=7
Safety: completed=t-world-trade-downtown-brooklyn, t-atlantic-terminal-jamaica | fallback=atlantic-terminal -> jamaica
New weakness: outer branches can now press the central spine.

Turn 36 | Red (outer opportunist)
Snapshot: strongest=t-secaucus-jamaica weakest=t-chelsea-world-trade completed=1 incomplete=3
Plan: secaucus -> jamaica | Risk: Newark Penn -> Newark Airpt. | Threat: Union Sq. -> Battery Pk.
Hand before: cri:1 amb:0 eme:0 cob:1 vio:2 obs:0 ivo:0 ros:1 loco:0 | tickets=4 trains=9 stations=3
Action: claim newark-penn-newark-airport with violet | Why: 1 ticket(s) complete if claimed. | Result: success (score updated)
Hand after: cri:1 amb:0 eme:0 cob:1 vio:0 obs:0 ivo:0 ros:1 loco:0 | score=18 trains=7
Safety: completed=t-hoboken-chelsea | fallback=chelsea -> world-trade
New weakness: the center can still outscore if left uncontested.

Turn 37 | Blue (central optimizer)
Snapshot: strongest=t-newark-downtown-brooklyn weakest=t-atlantic-terminal-jamaica completed=2 incomplete=2
Plan: newark-penn -> downtown-brooklyn | Risk: no claimable route | Threat: Newark Airpt. -> Hudson Yds.
Hand before: cri:1 amb:0 eme:0 cob:1 vio:0 obs:1 ivo:1 ros:1 loco:0 | tickets=4 trains=7 stations=3
Action: draw card from deck | Second draw: deck | Why: no claimable route yet; kept tempo with cards.
Hand after: cri:1 amb:0 eme:0 cob:2 vio:0 obs:1 ivo:1 ros:1 loco:1 | score=18 trains=7
Safety: completed=t-world-trade-downtown-brooklyn, t-atlantic-terminal-jamaica | fallback=atlantic-terminal -> jamaica
New weakness: outer branches can now press the central spine.

Turn 38 | Red (outer opportunist)
Snapshot: strongest=t-secaucus-jamaica weakest=t-chelsea-world-trade completed=1 incomplete=3
Plan: secaucus -> jamaica | Risk: no claimable route | Threat: Union Sq. -> Battery Pk.
Hand before: cri:1 amb:0 eme:0 cob:1 vio:0 obs:0 ivo:0 ros:1 loco:0 | tickets=4 trains=7 stations=3
Action: draw card from deck | Second draw: deck | Why: building toward Penn Dist. -> Grand Central rather than over-drawing tickets.
Hand after: cri:1 amb:0 eme:1 cob:1 vio:0 obs:0 ivo:0 ros:2 loco:0 | score=18 trains=7
Safety: completed=t-hoboken-chelsea | fallback=chelsea -> world-trade
New weakness: the center can still outscore if left uncontested.

Turn 39 | Blue (central optimizer)
Snapshot: strongest=t-newark-downtown-brooklyn weakest=t-atlantic-terminal-jamaica completed=2 incomplete=2
Plan: newark-penn -> downtown-brooklyn | Risk: Secaucus -> Penn Dist. | Threat: Newark Airpt. -> Hudson Yds.
Hand before: cri:1 amb:0 eme:0 cob:2 vio:0 obs:1 ivo:1 ros:1 loco:1 | tickets=4 trains=7 stations=3
Action: claim secaucus-midtown-west with cobalt | Why: 2 ticket(s) complete if claimed. | Result: failed claim / tunnel surcharge or affordability blocked secaucus-midtown-west. | Reveal: locomotive, crimson, emerald
Hand after: cri:1 amb:0 eme:0 cob:2 vio:0 obs:1 ivo:1 ros:1 loco:1 | score=18 trains=7
Safety: completed=t-world-trade-downtown-brooklyn, t-atlantic-terminal-jamaica | fallback=atlantic-terminal -> jamaica
New weakness: outer branches can now press the central spine.

Turn 40 | Red (outer opportunist)
Snapshot: strongest=t-secaucus-jamaica weakest=t-chelsea-world-trade completed=1 incomplete=3
Plan: secaucus -> jamaica | Risk: Penn Dist. -> Grand Central | Threat: Union Sq. -> Battery Pk.
Hand before: cri:1 amb:0 eme:1 cob:1 vio:0 obs:0 ivo:0 ros:2 loco:0 | tickets=4 trains=7 stations=3
Action: claim midtown-west-grand-central with rose | Why: 1 ticket(s) complete if claimed. | Result: success (score updated)
Hand after: cri:1 amb:0 eme:1 cob:1 vio:0 obs:0 ivo:0 ros:0 loco:0 | score=20 trains=5
Safety: completed=t-hoboken-chelsea | fallback=chelsea -> world-trade
New weakness: the center can still outscore if left uncontested.

Turn 41 | Blue (central optimizer)
Snapshot: strongest=t-newark-downtown-brooklyn weakest=t-atlantic-terminal-jamaica completed=2 incomplete=2
Plan: newark-penn -> downtown-brooklyn | Risk: Union Sq. -> Williamsburg | Threat: Hudson Yds. -> Grand Central
Hand before: cri:1 amb:0 eme:0 cob:2 vio:0 obs:1 ivo:1 ros:1 loco:1 | tickets=4 trains=7 stations=3
Action: claim union-square-williamsburg with cobalt | Why: 2 ticket(s) complete if claimed. | Result: success (score updated)
Hand after: cri:1 amb:0 eme:0 cob:0 vio:0 obs:1 ivo:1 ros:1 loco:0 | score=22 trains=4
Safety: completed=t-world-trade-downtown-brooklyn, t-atlantic-terminal-jamaica | fallback=atlantic-terminal -> jamaica
New weakness: outer branches can now press the central spine.

Turn 42 | Red (outer opportunist)
Snapshot: strongest=t-secaucus-jamaica weakest=t-chelsea-world-trade completed=1 incomplete=3
Plan: secaucus -> jamaica | Risk: no claimable route | Threat: Union Sq. -> Battery Pk.
Hand before: cri:1 amb:0 eme:1 cob:1 vio:0 obs:0 ivo:0 ros:0 loco:0 | tickets=4 trains=5 stations=3
Action: draw card from deck | Second draw: deck | Why: no claimable route yet; kept tempo with cards.
Hand after: cri:1 amb:0 eme:1 cob:1 vio:0 obs:1 ivo:0 ros:1 loco:0 | score=20 trains=5
Safety: completed=t-hoboken-chelsea | fallback=chelsea -> world-trade
New weakness: the center can still outscore if left uncontested.

Turn 43 | Blue (central optimizer)
Snapshot: strongest=t-newark-downtown-brooklyn weakest=t-atlantic-terminal-jamaica completed=2 incomplete=2
Plan: newark-penn -> downtown-brooklyn | Risk: no claimable route | Threat: Hudson Yds. -> Grand Central
Hand before: cri:1 amb:0 eme:0 cob:0 vio:0 obs:1 ivo:1 ros:1 loco:0 | tickets=4 trains=4 stations=3
Action: draw card from deck | Second draw: deck | Why: no claimable route yet; kept tempo with cards.
Hand after: cri:1 amb:0 eme:0 cob:0 vio:1 obs:1 ivo:2 ros:1 loco:0 | score=22 trains=4
Safety: completed=t-world-trade-downtown-brooklyn, t-atlantic-terminal-jamaica | fallback=atlantic-terminal -> jamaica
New weakness: outer branches can now press the central spine.

Turn 44 | Red (outer opportunist)
Snapshot: strongest=t-secaucus-jamaica weakest=t-chelsea-world-trade completed=1 incomplete=3
Plan: secaucus -> jamaica | Risk: no claimable route | Threat: Union Sq. -> Battery Pk.
Hand before: cri:1 amb:0 eme:1 cob:1 vio:0 obs:1 ivo:0 ros:1 loco:0 | tickets=4 trains=5 stations=3
Action: draw card from deck | Second draw: deck | Why: no claimable route yet; kept tempo with cards.
Hand after: cri:1 amb:0 eme:2 cob:2 vio:0 obs:1 ivo:0 ros:1 loco:0 | score=20 trains=5
Safety: completed=t-hoboken-chelsea | fallback=chelsea -> world-trade
New weakness: the center can still outscore if left uncontested.

Turn 45 | Blue (central optimizer)
Snapshot: strongest=t-newark-downtown-brooklyn weakest=t-atlantic-terminal-jamaica completed=2 incomplete=2
Plan: newark-penn -> downtown-brooklyn | Risk: no claimable route | Threat: Hudson Yds. -> Grand Central
Hand before: cri:1 amb:0 eme:0 cob:0 vio:1 obs:1 ivo:2 ros:1 loco:0 | tickets=4 trains=4 stations=3
Action: draw card from deck | Second draw: deck | Why: no claimable route yet; kept tempo with cards.
Hand after: cri:1 amb:0 eme:0 cob:0 vio:2 obs:2 ivo:2 ros:1 loco:0 | score=22 trains=4
Safety: completed=t-world-trade-downtown-brooklyn, t-atlantic-terminal-jamaica | fallback=atlantic-terminal -> jamaica
New weakness: outer branches can now press the central spine.

Turn 46 | Red (outer opportunist)
Snapshot: strongest=t-secaucus-jamaica weakest=t-chelsea-world-trade completed=1 incomplete=3
Plan: secaucus -> jamaica | Risk: no claimable route | Threat: Union Sq. -> Battery Pk.
Hand before: cri:1 amb:0 eme:2 cob:2 vio:0 obs:1 ivo:0 ros:1 loco:0 | tickets=4 trains=5 stations=3
Action: draw card from deck | Second draw: deck | Why: no claimable route yet; kept tempo with cards.
Hand after: cri:1 amb:0 eme:2 cob:3 vio:0 obs:2 ivo:0 ros:1 loco:0 | score=20 trains=5
Safety: completed=t-hoboken-chelsea | fallback=chelsea -> world-trade
New weakness: the center can still outscore if left uncontested.

Turn 47 | Blue (central optimizer)
Snapshot: strongest=t-newark-downtown-brooklyn weakest=t-atlantic-terminal-jamaica completed=2 incomplete=2
Plan: newark-penn -> downtown-brooklyn | Risk: no claimable route | Threat: Hudson Yds. -> Grand Central
Hand before: cri:1 amb:0 eme:0 cob:0 vio:2 obs:2 ivo:2 ros:1 loco:0 | tickets=4 trains=4 stations=3
Action: draw card from deck | Second draw: market[2] | Why: building toward Battery Pk. -> Downtown Bklyn rather than over-drawing tickets.
Hand after: cri:3 amb:0 eme:0 cob:0 vio:2 obs:2 ivo:2 ros:1 loco:0 | score=22 trains=4
Safety: completed=t-world-trade-downtown-brooklyn, t-atlantic-terminal-jamaica | fallback=atlantic-terminal -> jamaica
New weakness: outer branches can now press the central spine.

Turn 48 | Red (outer opportunist)
Snapshot: strongest=t-secaucus-jamaica weakest=t-chelsea-world-trade completed=1 incomplete=3
Plan: secaucus -> jamaica | Risk: Secaucus -> Penn Dist. | Threat: Union Sq. -> Battery Pk.
Hand before: cri:1 amb:0 eme:2 cob:3 vio:0 obs:2 ivo:0 ros:1 loco:0 | tickets=4 trains=5 stations=3
Action: claim secaucus-midtown-west with cobalt | Why: 1 ticket(s) complete if claimed. | Result: failed claim / tunnel surcharge or affordability blocked secaucus-midtown-west. | Reveal: cobalt, obsidian, rose
Hand after: cri:1 amb:0 eme:2 cob:3 vio:0 obs:2 ivo:0 ros:1 loco:0 | score=20 trains=5
Safety: completed=t-hoboken-chelsea | fallback=chelsea -> world-trade
New weakness: the center can still outscore if left uncontested.

Turn 49 | Blue (central optimizer)
Snapshot: strongest=t-newark-downtown-brooklyn weakest=t-atlantic-terminal-jamaica completed=2 incomplete=2
Plan: newark-penn -> downtown-brooklyn | Risk: Secaucus -> Newark Penn | Threat: Hudson Yds. -> Grand Central
Hand before: cri:3 amb:0 eme:0 cob:0 vio:2 obs:2 ivo:2 ros:1 loco:0 | tickets=4 trains=4 stations=3
Action: claim secaucus-newark-penn with crimson | Why: 2 ticket(s) complete if claimed. | Result: success (score updated)
Hand after: cri:0 amb:0 eme:0 cob:0 vio:2 obs:2 ivo:2 ros:1 loco:0 | score=26 trains=1
Safety: completed=t-world-trade-downtown-brooklyn, t-atlantic-terminal-jamaica | fallback=atlantic-terminal -> jamaica
New weakness: outer branches can now press the central spine.

Turn 50 | Red (outer opportunist)
Snapshot: strongest=t-secaucus-jamaica weakest=t-chelsea-world-trade completed=1 incomplete=3
Plan: secaucus -> jamaica | Risk: Long Isl. City -> Jamaica | Threat: Union Sq. -> Battery Pk.
Hand before: cri:1 amb:0 eme:2 cob:3 vio:0 obs:2 ivo:0 ros:1 loco:0 | tickets=4 trains=5 stations=3
Action: claim long-island-city-jamaica with cobalt | Why: 1 ticket(s) complete if claimed. | Result: success (score updated)
Hand after: cri:1 amb:0 eme:2 cob:0 vio:0 obs:2 ivo:0 ros:1 loco:0 | score=24 trains=2
Safety: completed=t-hoboken-chelsea | fallback=chelsea -> world-trade
New weakness: the center can still outscore if left uncontested.


Final:
Blue: score=40 trainsLeft=1 stationsLeft=3
  Ticket delta: -8 | Unused stations: +12 | Longest route: 14 trains | Longest route bonus: +10 | Completed tickets: t-world-trade-downtown-brooklyn, t-atlantic-terminal-jamaica | Failed tickets: t-newark-downtown-brooklyn, t-grand-central-flushing
  tickets: t-newark-downtown-brooklyn, t-grand-central-flushing, t-world-trade-downtown-brooklyn, t-atlantic-terminal-jamaica
Red: score=14 trainsLeft=2 stationsLeft=3
  Ticket delta: -22 | Unused stations: +12 | Longest route: 8 trains | Longest route bonus: +0 | Completed tickets: t-hoboken-chelsea | Failed tickets: t-secaucus-jamaica, t-exchange-place-downtown-brooklyn, t-chelsea-world-trade
  tickets: t-secaucus-jamaica, t-exchange-place-downtown-brooklyn, t-chelsea-world-trade, t-hoboken-chelsea