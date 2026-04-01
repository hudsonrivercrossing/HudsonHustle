Map: Hudson Hustle Anchor Prototype (20 cities, 32 routes, 33 tickets)
Setup: 2-player self-play, seed=1337, personas = central optimizer vs outer opportunist

Setup | Blue (central optimizer)
Pending: t-exchange-jamaica, t-grand-central-flushing, t-long-island-city-downtown-brooklyn, t-grand-central-jamaica
Keeps: t-exchange-jamaica, t-grand-central-flushing, t-long-island-city-downtown-brooklyn, t-grand-central-jamaica
Tickets locked. Phase=initialTickets

Setup | Red (outer opportunist)
Pending: t-secaucus-jamaica, t-exchange-place-downtown-brooklyn, t-world-trade-long-island-city, t-flushing-atlantic-terminal
Keeps: t-secaucus-jamaica, t-exchange-place-downtown-brooklyn, t-world-trade-long-island-city, t-flushing-atlantic-terminal
Tickets locked. Phase=main

Turn 1 | Blue (central optimizer)
Snapshot: strongest=t-exchange-jamaica weakest=t-long-island-city-downtown-brooklyn completed=0 incomplete=4
Plan: exchange-place -> jamaica | Risk: Exchange Pl. -> World Trade | Threat: Hudson Yds. -> Grand Central
Hand before: cri:1 amb:0 eme:0 cob:0 vio:1 obs:0 ivo:1 ros:0 loco:1 | tickets=4 trains=24 stations=3
Action: claim exchange-place-world-trade-a with crimson | Why: best route-progress move right now. | Result: failed claim / tunnel surcharge or affordability blocked exchange-place-world-trade-a. | Reveal: locomotive, rose, ivory
Hand after: cri:1 amb:0 eme:0 cob:0 vio:1 obs:0 ivo:1 ros:0 loco:1 | score=0 trains=24
Safety: completed=none | fallback=long-island-city -> downtown-brooklyn
New weakness: outer branches can now press the central spine.

Turn 2 | Red (outer opportunist)
Snapshot: strongest=t-secaucus-jamaica weakest=t-world-trade-long-island-city completed=0 incomplete=4
Plan: secaucus -> jamaica | Risk: Atlantic Term. -> Jamaica | Threat: Penn Dist. -> Chelsea
Hand before: cri:2 amb:0 eme:0 cob:2 vio:0 obs:0 ivo:0 ros:0 loco:0 | tickets=4 trains=24 stations=3
Action: claim atlantic-terminal-jamaica with cobalt | Why: best route-progress move right now. | Result: success (score updated)
Hand after: cri:2 amb:0 eme:0 cob:0 vio:0 obs:0 ivo:0 ros:0 loco:0 | score=2 trains=22
Safety: completed=none | fallback=world-trade -> long-island-city
New weakness: the center can still outscore if left uncontested.

Turn 3 | Blue (central optimizer)
Snapshot: strongest=t-exchange-jamaica weakest=t-long-island-city-downtown-brooklyn completed=0 incomplete=4
Plan: exchange-place -> jamaica | Risk: Williamsburg -> Downtown Bklyn | Threat: Red Hook -> Atlantic Term.
Hand before: cri:1 amb:0 eme:0 cob:0 vio:1 obs:0 ivo:1 ros:0 loco:1 | tickets=4 trains=24 stations=3
Action: claim williamsburg-downtown-brooklyn with crimson | Why: best route-progress move right now. | Result: success (score updated)
Hand after: cri:0 amb:0 eme:0 cob:0 vio:1 obs:0 ivo:1 ros:0 loco:0 | score=2 trains=22
Safety: completed=none | fallback=long-island-city -> downtown-brooklyn
New weakness: outer branches can now press the central spine.

Turn 4 | Red (outer opportunist)
Snapshot: strongest=t-secaucus-jamaica weakest=t-world-trade-long-island-city completed=0 incomplete=4
Plan: secaucus -> jamaica | Risk: Exchange Pl. -> World Trade | Threat: Union Sq. -> Williamsburg
Hand before: cri:2 amb:0 eme:0 cob:0 vio:0 obs:0 ivo:0 ros:0 loco:0 | tickets=4 trains=22 stations=3
Action: claim exchange-place-world-trade-a with crimson | Why: best route-progress move right now. | Result: success (score updated)
Hand after: cri:0 amb:0 eme:0 cob:0 vio:0 obs:0 ivo:0 ros:0 loco:0 | score=4 trains=20
Safety: completed=none | fallback=world-trade -> long-island-city
New weakness: the center can still outscore if left uncontested.

Turn 5 | Blue (central optimizer)
Snapshot: strongest=t-exchange-jamaica weakest=t-long-island-city-downtown-brooklyn completed=0 incomplete=4
Plan: exchange-place -> jamaica | Risk: no claimable route | Threat: Chelsea -> World Trade
Hand before: cri:0 amb:0 eme:0 cob:0 vio:1 obs:0 ivo:1 ros:0 loco:0 | tickets=4 trains=22 stations=3
Action: draw card from deck | Second draw: market[3] | Why: building toward Newark Penn -> Newark Airpt. rather than over-drawing tickets.
Hand after: cri:0 amb:0 eme:0 cob:0 vio:1 obs:0 ivo:3 ros:0 loco:0 | score=2 trains=22
Safety: completed=none | fallback=long-island-city -> downtown-brooklyn
New weakness: outer branches can now press the central spine.

Turn 6 | Red (outer opportunist)
Snapshot: strongest=t-secaucus-jamaica weakest=t-world-trade-long-island-city completed=0 incomplete=4
Plan: secaucus -> jamaica | Risk: no claimable route | Threat: Union Sq. -> Williamsburg
Hand before: cri:0 amb:0 eme:0 cob:0 vio:0 obs:0 ivo:0 ros:0 loco:0 | tickets=4 trains=20 stations=3
Action: draw card from deck | Second draw: deck | Why: no claimable route yet; kept tempo with cards.
Hand after: cri:1 amb:1 eme:0 cob:0 vio:0 obs:0 ivo:0 ros:0 loco:0 | score=4 trains=20
Safety: completed=none | fallback=world-trade -> long-island-city
New weakness: the center can still outscore if left uncontested.

Turn 7 | Blue (central optimizer)
Snapshot: strongest=t-exchange-jamaica weakest=t-long-island-city-downtown-brooklyn completed=0 incomplete=4
Plan: exchange-place -> jamaica | Risk: Hoboken -> Chelsea | Threat: Chelsea -> World Trade
Hand before: cri:0 amb:0 eme:0 cob:0 vio:1 obs:0 ivo:3 ros:0 loco:0 | tickets=4 trains=22 stations=3
Action: draw card from deck | Second draw: deck | Why: building toward Hoboken -> Chelsea rather than over-drawing tickets.
Hand after: cri:1 amb:1 eme:0 cob:0 vio:1 obs:0 ivo:3 ros:0 loco:0 | score=2 trains=22
Safety: completed=none | fallback=long-island-city -> downtown-brooklyn
New weakness: outer branches can now press the central spine.

Turn 8 | Red (outer opportunist)
Snapshot: strongest=t-secaucus-jamaica weakest=t-world-trade-long-island-city completed=0 incomplete=4
Plan: secaucus -> jamaica | Risk: no claimable route | Threat: Union Sq. -> Williamsburg
Hand before: cri:1 amb:1 eme:0 cob:0 vio:0 obs:0 ivo:0 ros:0 loco:0 | tickets=4 trains=20 stations=3
Action: draw card from deck | Second draw: deck | Why: no claimable route yet; kept tempo with cards.
Hand after: cri:1 amb:1 eme:1 cob:0 vio:0 obs:0 ivo:1 ros:0 loco:0 | score=4 trains=20
Safety: completed=none | fallback=world-trade -> long-island-city
New weakness: the center can still outscore if left uncontested.

Turn 9 | Blue (central optimizer)
Snapshot: strongest=t-exchange-jamaica weakest=t-long-island-city-downtown-brooklyn completed=0 incomplete=4
Plan: exchange-place -> jamaica | Risk: Hoboken -> Chelsea | Threat: Chelsea -> World Trade
Hand before: cri:1 amb:1 eme:0 cob:0 vio:1 obs:0 ivo:3 ros:0 loco:0 | tickets=4 trains=22 stations=3
Action: draw card from deck | Second draw: deck | Why: building toward Grand Central -> Flushing rather than over-drawing tickets.
Hand after: cri:1 amb:1 eme:0 cob:0 vio:1 obs:0 ivo:3 ros:1 loco:1 | score=2 trains=22
Safety: completed=none | fallback=long-island-city -> downtown-brooklyn
New weakness: outer branches can now press the central spine.

Turn 10 | Red (outer opportunist)
Snapshot: strongest=t-secaucus-jamaica weakest=t-world-trade-long-island-city completed=0 incomplete=4
Plan: secaucus -> jamaica | Risk: no claimable route | Threat: Union Sq. -> Williamsburg
Hand before: cri:1 amb:1 eme:1 cob:0 vio:0 obs:0 ivo:1 ros:0 loco:0 | tickets=4 trains=20 stations=3
Action: draw card from deck | Second draw: deck | Why: no claimable route yet; kept tempo with cards.
Hand after: cri:1 amb:1 eme:1 cob:0 vio:0 obs:2 ivo:1 ros:0 loco:0 | score=4 trains=20
Safety: completed=none | fallback=world-trade -> long-island-city
New weakness: the center can still outscore if left uncontested.

Turn 11 | Blue (central optimizer)
Snapshot: strongest=t-exchange-jamaica weakest=t-long-island-city-downtown-brooklyn completed=0 incomplete=4
Plan: exchange-place -> jamaica | Risk: Grand Central -> Flushing | Threat: Chelsea -> World Trade
Hand before: cri:1 amb:1 eme:0 cob:0 vio:1 obs:0 ivo:3 ros:1 loco:1 | tickets=4 trains=22 stations=3
Action: claim grand-central-flushing with ivory | Why: 1 ticket(s) complete if claimed. | Result: success (score updated)
Hand after: cri:1 amb:1 eme:0 cob:0 vio:1 obs:0 ivo:0 ros:1 loco:0 | score=9 trains=18
Safety: completed=t-grand-central-flushing | fallback=long-island-city -> downtown-brooklyn
New weakness: outer branches can now press the central spine.

Turn 12 | Red (outer opportunist)
Snapshot: strongest=t-secaucus-jamaica weakest=t-world-trade-long-island-city completed=0 incomplete=4
Plan: secaucus -> jamaica | Risk: Red Hook -> Atlantic Term. | Threat: Penn Dist. -> Grand Central
Hand before: cri:1 amb:1 eme:1 cob:0 vio:0 obs:2 ivo:1 ros:0 loco:0 | tickets=4 trains=20 stations=3
Action: claim red-hook-atlantic-terminal with obsidian | Why: best route-progress move right now. | Result: success (score updated)
Hand after: cri:1 amb:1 eme:1 cob:0 vio:0 obs:0 ivo:1 ros:0 loco:0 | score=6 trains=18
Safety: completed=none | fallback=world-trade -> long-island-city
New weakness: the center can still outscore if left uncontested.

Turn 13 | Blue (central optimizer)
Snapshot: strongest=t-exchange-jamaica weakest=t-long-island-city-downtown-brooklyn completed=1 incomplete=3
Plan: exchange-place -> jamaica | Risk: no claimable route | Threat: Battery Pk. -> Red Hook
Hand before: cri:1 amb:1 eme:0 cob:0 vio:1 obs:0 ivo:0 ros:1 loco:0 | tickets=4 trains=18 stations=3
Action: draw card from deck | Second draw: deck | Why: no claimable route yet; kept tempo with cards.
Hand after: cri:1 amb:1 eme:0 cob:1 vio:1 obs:0 ivo:0 ros:2 loco:0 | score=9 trains=18
Safety: completed=t-grand-central-flushing | fallback=long-island-city -> downtown-brooklyn
New weakness: outer branches can now press the central spine.

Turn 14 | Red (outer opportunist)
Snapshot: strongest=t-secaucus-jamaica weakest=t-world-trade-long-island-city completed=0 incomplete=4
Plan: secaucus -> jamaica | Risk: no claimable route | Threat: Penn Dist. -> Grand Central
Hand before: cri:1 amb:1 eme:1 cob:0 vio:0 obs:0 ivo:1 ros:0 loco:0 | tickets=4 trains=18 stations=3
Action: draw card from deck | Second draw: deck | Why: no claimable route yet; kept tempo with cards.
Hand after: cri:1 amb:1 eme:2 cob:0 vio:0 obs:1 ivo:1 ros:0 loco:0 | score=6 trains=18
Safety: completed=none | fallback=world-trade -> long-island-city
New weakness: the center can still outscore if left uncontested.

Turn 15 | Blue (central optimizer)
Snapshot: strongest=t-exchange-jamaica weakest=t-long-island-city-downtown-brooklyn completed=1 incomplete=3
Plan: exchange-place -> jamaica | Risk: Penn Dist. -> Grand Central | Threat: Battery Pk. -> Red Hook
Hand before: cri:1 amb:1 eme:0 cob:1 vio:1 obs:0 ivo:0 ros:2 loco:0 | tickets=4 trains=18 stations=3
Action: claim midtown-west-grand-central with rose | Why: 1 ticket(s) complete if claimed. | Result: success (score updated)
Hand after: cri:1 amb:1 eme:0 cob:1 vio:1 obs:0 ivo:0 ros:0 loco:0 | score=11 trains=16
Safety: completed=t-grand-central-flushing | fallback=long-island-city -> downtown-brooklyn
New weakness: outer branches can now press the central spine.

Turn 16 | Red (outer opportunist)
Snapshot: strongest=t-secaucus-jamaica weakest=t-world-trade-long-island-city completed=0 incomplete=4
Plan: secaucus -> jamaica | Risk: Hoboken -> Grove St | Threat: Penn Dist. -> Chelsea
Hand before: cri:1 amb:1 eme:2 cob:0 vio:0 obs:1 ivo:1 ros:0 loco:0 | tickets=4 trains=18 stations=3
Action: draw card from deck | Second draw: deck | Why: building toward Penn Dist. -> Long Isl. City rather than over-drawing tickets.
Hand after: cri:1 amb:1 eme:3 cob:0 vio:0 obs:1 ivo:1 ros:0 loco:1 | score=6 trains=18
Safety: completed=none | fallback=world-trade -> long-island-city
New weakness: the center can still outscore if left uncontested.

Turn 17 | Blue (central optimizer)
Snapshot: strongest=t-exchange-jamaica weakest=t-long-island-city-downtown-brooklyn completed=1 incomplete=3
Plan: exchange-place -> jamaica | Risk: no claimable route | Threat: Battery Pk. -> Red Hook
Hand before: cri:1 amb:1 eme:0 cob:1 vio:1 obs:0 ivo:0 ros:0 loco:0 | tickets=4 trains=16 stations=3
Action: draw card from deck | Second draw: deck | Why: no claimable route yet; kept tempo with cards.
Hand after: cri:1 amb:2 eme:0 cob:1 vio:1 obs:0 ivo:0 ros:1 loco:0 | score=11 trains=16
Safety: completed=t-grand-central-flushing | fallback=long-island-city -> downtown-brooklyn
New weakness: outer branches can now press the central spine.

Turn 18 | Red (outer opportunist)
Snapshot: strongest=t-secaucus-jamaica weakest=t-world-trade-long-island-city completed=0 incomplete=4
Plan: secaucus -> jamaica | Risk: Penn Dist. -> Long Isl. City | Threat: Penn Dist. -> Chelsea
Hand before: cri:1 amb:1 eme:3 cob:0 vio:0 obs:1 ivo:1 ros:0 loco:1 | tickets=4 trains=18 stations=3
Action: claim midtown-west-long-island-city with emerald | Why: best route-progress move right now. | Result: success (score updated)
Hand after: cri:1 amb:1 eme:0 cob:0 vio:0 obs:1 ivo:1 ros:0 loco:0 | score=10 trains=15
Safety: completed=none | fallback=world-trade -> long-island-city
New weakness: the center can still outscore if left uncontested.

Turn 19 | Blue (central optimizer)
Snapshot: strongest=t-exchange-jamaica weakest=t-long-island-city-downtown-brooklyn completed=1 incomplete=3
Plan: exchange-place -> jamaica | Risk: Penn Dist. -> Chelsea | Threat: Battery Pk. -> Red Hook
Hand before: cri:1 amb:2 eme:0 cob:1 vio:1 obs:0 ivo:0 ros:1 loco:0 | tickets=4 trains=16 stations=3
Action: claim midtown-west-chelsea with amber | Why: 1 ticket(s) complete if claimed. | Result: success (score updated)
Hand after: cri:1 amb:0 eme:0 cob:1 vio:1 obs:0 ivo:0 ros:1 loco:0 | score=13 trains=14
Safety: completed=t-grand-central-flushing | fallback=long-island-city -> downtown-brooklyn
New weakness: outer branches can now press the central spine.

Turn 20 | Red (outer opportunist)
Snapshot: strongest=t-secaucus-jamaica weakest=t-world-trade-long-island-city completed=0 incomplete=4
Plan: secaucus -> jamaica | Risk: no claimable route | Threat: Chelsea -> World Trade
Hand before: cri:1 amb:1 eme:0 cob:0 vio:0 obs:1 ivo:1 ros:0 loco:0 | tickets=4 trains=15 stations=3
Action: draw card from deck | Second draw: deck | Why: no claimable route yet; kept tempo with cards.
Hand after: cri:1 amb:1 eme:0 cob:0 vio:0 obs:1 ivo:2 ros:1 loco:0 | score=10 trains=15
Safety: completed=none | fallback=world-trade -> long-island-city
New weakness: the center can still outscore if left uncontested.

Turn 21 | Blue (central optimizer)
Snapshot: strongest=t-exchange-jamaica weakest=t-long-island-city-downtown-brooklyn completed=1 incomplete=3
Plan: exchange-place -> jamaica | Risk: no claimable route | Threat: Battery Pk. -> Red Hook
Hand before: cri:1 amb:0 eme:0 cob:1 vio:1 obs:0 ivo:0 ros:1 loco:0 | tickets=4 trains=14 stations=3
Action: draw card from deck | Second draw: market[2] | Why: building toward Chelsea -> World Trade rather than over-drawing tickets.
Hand after: cri:1 amb:0 eme:0 cob:1 vio:1 obs:0 ivo:0 ros:3 loco:0 | score=13 trains=14
Safety: completed=t-grand-central-flushing | fallback=long-island-city -> downtown-brooklyn
New weakness: outer branches can now press the central spine.

Turn 22 | Red (outer opportunist)
Snapshot: strongest=t-secaucus-jamaica weakest=t-world-trade-long-island-city completed=0 incomplete=4
Plan: secaucus -> jamaica | Risk: Newark Penn -> Newark Airpt. | Threat: Chelsea -> World Trade
Hand before: cri:1 amb:1 eme:0 cob:0 vio:0 obs:1 ivo:2 ros:1 loco:0 | tickets=4 trains=15 stations=3
Action: draw card from market[4] | Second draw: deck | Why: building toward Hoboken -> Chelsea rather than over-drawing tickets.
Hand after: cri:1 amb:1 eme:0 cob:0 vio:0 obs:1 ivo:3 ros:1 loco:1 | score=10 trains=15
Safety: completed=none | fallback=world-trade -> long-island-city
New weakness: the center can still outscore if left uncontested.

Turn 23 | Blue (central optimizer)
Snapshot: strongest=t-exchange-jamaica weakest=t-long-island-city-downtown-brooklyn completed=1 incomplete=3
Plan: exchange-place -> jamaica | Risk: Chelsea -> World Trade | Threat: Battery Pk. -> Red Hook
Hand before: cri:1 amb:0 eme:0 cob:1 vio:1 obs:0 ivo:0 ros:3 loco:0 | tickets=4 trains=14 stations=3
Action: claim chelsea-world-trade with rose | Why: 1 ticket(s) complete if claimed. | Result: success (score updated)
Hand after: cri:1 amb:0 eme:0 cob:1 vio:1 obs:0 ivo:0 ros:1 loco:0 | score=15 trains=12
Safety: completed=t-grand-central-flushing | fallback=long-island-city -> downtown-brooklyn
New weakness: outer branches can now press the central spine.

Turn 24 | Red (outer opportunist)
Snapshot: strongest=t-secaucus-jamaica weakest=t-world-trade-long-island-city completed=0 incomplete=4
Plan: secaucus -> jamaica | Risk: World Trade -> Battery Pk. | Threat: Chelsea -> Union Sq.
Hand before: cri:1 amb:1 eme:0 cob:0 vio:0 obs:1 ivo:3 ros:1 loco:1 | tickets=4 trains=15 stations=3
Action: claim world-trade-battery-park with amber | Why: best route-progress move right now. | Result: success (score updated)
Hand after: cri:1 amb:0 eme:0 cob:0 vio:0 obs:1 ivo:3 ros:1 loco:0 | score=12 trains=13
Safety: completed=none | fallback=world-trade -> long-island-city
New weakness: the center can still outscore if left uncontested.

Turn 25 | Blue (central optimizer)
Snapshot: strongest=t-exchange-jamaica weakest=t-long-island-city-downtown-brooklyn completed=1 incomplete=3
Plan: exchange-place -> jamaica | Risk: no claimable route | Threat: Battery Pk. -> Red Hook
Hand before: cri:1 amb:0 eme:0 cob:1 vio:1 obs:0 ivo:0 ros:1 loco:0 | tickets=4 trains=12 stations=3
Action: draw card from deck | Second draw: deck | Why: no claimable route yet; kept tempo with cards.
Hand after: cri:1 amb:0 eme:0 cob:1 vio:1 obs:1 ivo:1 ros:1 loco:0 | score=15 trains=12
Safety: completed=t-grand-central-flushing | fallback=long-island-city -> downtown-brooklyn
New weakness: outer branches can now press the central spine.

Turn 26 | Red (outer opportunist)
Snapshot: strongest=t-secaucus-jamaica weakest=t-world-trade-long-island-city completed=0 incomplete=4
Plan: secaucus -> jamaica | Risk: Hoboken -> Chelsea | Threat: Chelsea -> Union Sq.
Hand before: cri:1 amb:0 eme:0 cob:0 vio:0 obs:1 ivo:3 ros:1 loco:0 | tickets=4 trains=13 stations=3
Action: draw card from deck | Second draw: deck | Why: building toward Hoboken -> Chelsea rather than over-drawing tickets.
Hand after: cri:1 amb:1 eme:0 cob:1 vio:0 obs:1 ivo:3 ros:1 loco:0 | score=12 trains=13
Safety: completed=none | fallback=world-trade -> long-island-city
New weakness: the center can still outscore if left uncontested.

Turn 27 | Blue (central optimizer)
Snapshot: strongest=t-exchange-jamaica weakest=t-long-island-city-downtown-brooklyn completed=1 incomplete=3
Plan: exchange-place -> jamaica | Risk: no claimable route | Threat: Battery Pk. -> Red Hook
Hand before: cri:1 amb:0 eme:0 cob:1 vio:1 obs:1 ivo:1 ros:1 loco:0 | tickets=4 trains=12 stations=3
Action: draw card from deck | Second draw: market[0] | Why: building toward Chelsea -> Union Sq. rather than over-drawing tickets.
Hand after: cri:1 amb:0 eme:0 cob:1 vio:3 obs:1 ivo:1 ros:1 loco:0 | score=15 trains=12
Safety: completed=t-grand-central-flushing | fallback=long-island-city -> downtown-brooklyn
New weakness: outer branches can now press the central spine.

Turn 28 | Red (outer opportunist)
Snapshot: strongest=t-secaucus-jamaica weakest=t-world-trade-long-island-city completed=0 incomplete=4
Plan: secaucus -> jamaica | Risk: Hoboken -> Chelsea | Threat: Chelsea -> Union Sq.
Hand before: cri:1 amb:1 eme:0 cob:1 vio:0 obs:1 ivo:3 ros:1 loco:0 | tickets=4 trains=13 stations=3
Action: draw card from deck | Second draw: deck | Why: building toward Hudson Yds. -> Grand Central rather than over-drawing tickets.
Hand after: cri:1 amb:2 eme:0 cob:1 vio:0 obs:1 ivo:3 ros:2 loco:0 | score=12 trains=13
Safety: completed=none | fallback=world-trade -> long-island-city
New weakness: the center can still outscore if left uncontested.

Turn 29 | Blue (central optimizer)
Snapshot: strongest=t-exchange-jamaica weakest=t-long-island-city-downtown-brooklyn completed=1 incomplete=3
Plan: exchange-place -> jamaica | Risk: Chelsea -> Union Sq. | Threat: Battery Pk. -> Red Hook
Hand before: cri:1 amb:0 eme:0 cob:1 vio:3 obs:1 ivo:1 ros:1 loco:0 | tickets=4 trains=12 stations=3
Action: claim chelsea-union-square with violet | Why: 1 ticket(s) complete if claimed. | Result: success (score updated)
Hand after: cri:1 amb:0 eme:0 cob:1 vio:1 obs:1 ivo:1 ros:1 loco:0 | score=17 trains=10
Safety: completed=t-grand-central-flushing | fallback=long-island-city -> downtown-brooklyn
New weakness: outer branches can now press the central spine.

Turn 30 | Red (outer opportunist)
Snapshot: strongest=t-secaucus-jamaica weakest=t-world-trade-long-island-city completed=0 incomplete=4
Plan: secaucus -> jamaica | Risk: Hudson Yds. -> Grand Central | Threat: Union Sq. -> Battery Pk.
Hand before: cri:1 amb:2 eme:0 cob:1 vio:0 obs:1 ivo:3 ros:2 loco:0 | tickets=4 trains=13 stations=3
Action: draw card from deck | Second draw: deck | Why: building toward Flushing -> Jamaica rather than over-drawing tickets.
Hand after: cri:1 amb:2 eme:0 cob:1 vio:1 obs:1 ivo:3 ros:2 loco:1 | score=12 trains=13
Safety: completed=none | fallback=world-trade -> long-island-city
New weakness: the center can still outscore if left uncontested.

Turn 31 | Blue (central optimizer)
Snapshot: strongest=t-exchange-jamaica weakest=t-long-island-city-downtown-brooklyn completed=1 incomplete=3
Plan: exchange-place -> jamaica | Risk: no claimable route | Threat: Battery Pk. -> Red Hook
Hand before: cri:1 amb:0 eme:0 cob:1 vio:1 obs:1 ivo:1 ros:1 loco:0 | tickets=4 trains=10 stations=3
Action: draw card from deck | Second draw: deck | Why: building toward Newark Penn -> Newark Airpt. rather than over-drawing tickets.
Hand after: cri:1 amb:0 eme:0 cob:1 vio:1 obs:1 ivo:2 ros:2 loco:0 | score=17 trains=10
Safety: completed=t-grand-central-flushing | fallback=long-island-city -> downtown-brooklyn
New weakness: outer branches can now press the central spine.

Turn 32 | Red (outer opportunist)
Snapshot: strongest=t-secaucus-jamaica weakest=t-world-trade-long-island-city completed=0 incomplete=4
Plan: secaucus -> jamaica | Risk: Flushing -> Jamaica | Threat: Union Sq. -> Battery Pk.
Hand before: cri:1 amb:2 eme:0 cob:1 vio:1 obs:1 ivo:3 ros:2 loco:1 | tickets=4 trains=13 stations=3
Action: claim flushing-jamaica with amber | Why: 1 ticket(s) complete if claimed. | Result: success (score updated)
Hand after: cri:1 amb:0 eme:0 cob:1 vio:1 obs:1 ivo:3 ros:2 loco:0 | score=16 trains=10
Safety: completed=t-flushing-atlantic-terminal | fallback=world-trade -> long-island-city
New weakness: the center can still outscore if left uncontested.

Turn 33 | Blue (central optimizer)
Snapshot: strongest=t-exchange-jamaica weakest=t-long-island-city-downtown-brooklyn completed=1 incomplete=3
Plan: exchange-place -> jamaica | Risk: Downtown Bklyn -> Atlantic Term. | Threat: Battery Pk. -> Red Hook
Hand before: cri:1 amb:0 eme:0 cob:1 vio:1 obs:1 ivo:2 ros:2 loco:0 | tickets=4 trains=10 stations=3
Action: claim downtown-brooklyn-atlantic-terminal with rose | Why: 1 ticket(s) complete if claimed. | Result: success (score updated)
Hand after: cri:1 amb:0 eme:0 cob:1 vio:1 obs:1 ivo:2 ros:0 loco:0 | score=19 trains=8
Safety: completed=t-grand-central-flushing | fallback=long-island-city -> downtown-brooklyn
New weakness: outer branches can now press the central spine.

Turn 34 | Red (outer opportunist)
Snapshot: strongest=t-secaucus-jamaica weakest=t-world-trade-long-island-city completed=1 incomplete=3
Plan: secaucus -> jamaica | Risk: Hoboken -> Chelsea | Threat: Union Sq. -> Battery Pk.
Hand before: cri:1 amb:0 eme:0 cob:1 vio:1 obs:1 ivo:3 ros:2 loco:0 | tickets=4 trains=10 stations=3
Action: claim hoboken-chelsea with ivory | Why: 1 ticket(s) complete if claimed. | Result: success (score updated)
Hand after: cri:1 amb:0 eme:0 cob:1 vio:1 obs:1 ivo:0 ros:2 loco:0 | score=20 trains=7
Safety: completed=t-flushing-atlantic-terminal | fallback=world-trade -> long-island-city
New weakness: the center can still outscore if left uncontested.

Turn 35 | Blue (central optimizer)
Snapshot: strongest=t-exchange-jamaica weakest=t-long-island-city-downtown-brooklyn completed=1 incomplete=3
Plan: exchange-place -> jamaica | Risk: Newark Penn -> Newark Airpt. | Threat: Battery Pk. -> Red Hook
Hand before: cri:1 amb:0 eme:0 cob:1 vio:1 obs:1 ivo:2 ros:0 loco:0 | tickets=4 trains=8 stations=3
Action: claim newark-penn-newark-airport with ivory | Why: 1 ticket(s) complete if claimed. | Result: success (score updated)
Hand after: cri:1 amb:0 eme:0 cob:1 vio:1 obs:1 ivo:0 ros:0 loco:0 | score=21 trains=6
Safety: completed=t-grand-central-flushing | fallback=long-island-city -> downtown-brooklyn
New weakness: outer branches can now press the central spine.

Turn 36 | Red (outer opportunist)
Snapshot: strongest=t-secaucus-jamaica weakest=t-world-trade-long-island-city completed=1 incomplete=3
Plan: secaucus -> jamaica | Risk: no claimable route | Threat: Union Sq. -> Battery Pk.
Hand before: cri:1 amb:0 eme:0 cob:1 vio:1 obs:1 ivo:0 ros:2 loco:0 | tickets=4 trains=7 stations=3
Action: draw card from deck | Second draw: market[0] | Why: building toward Battery Pk. -> Downtown Bklyn rather than over-drawing tickets.
Hand after: cri:2 amb:0 eme:0 cob:1 vio:1 obs:1 ivo:0 ros:2 loco:1 | score=20 trains=7
Safety: completed=t-flushing-atlantic-terminal | fallback=world-trade -> long-island-city
New weakness: the center can still outscore if left uncontested.

Turn 37 | Blue (central optimizer)
Snapshot: strongest=t-exchange-jamaica weakest=t-long-island-city-downtown-brooklyn completed=1 incomplete=3
Plan: exchange-place -> jamaica | Risk: no claimable route | Threat: Battery Pk. -> Red Hook
Hand before: cri:1 amb:0 eme:0 cob:1 vio:1 obs:1 ivo:0 ros:0 loco:0 | tickets=4 trains=6 stations=3
Action: draw card from deck | Second draw: deck | Why: building toward Newark Penn -> Grove St rather than over-drawing tickets.
Hand after: cri:1 amb:0 eme:0 cob:1 vio:1 obs:3 ivo:0 ros:0 loco:0 | score=21 trains=6
Safety: completed=t-grand-central-flushing | fallback=long-island-city -> downtown-brooklyn
New weakness: outer branches can now press the central spine.

Turn 38 | Red (outer opportunist)
Snapshot: strongest=t-secaucus-jamaica weakest=t-world-trade-long-island-city completed=1 incomplete=3
Plan: secaucus -> jamaica | Risk: Battery Pk. -> Downtown Bklyn | Threat: Union Sq. -> Battery Pk.
Hand before: cri:2 amb:0 eme:0 cob:1 vio:1 obs:1 ivo:0 ros:2 loco:1 | tickets=4 trains=7 stations=3
Action: claim battery-park-downtown-brooklyn with crimson | Why: 2 ticket(s) complete if claimed. | Result: success (score updated)
Hand after: cri:0 amb:0 eme:0 cob:1 vio:1 obs:1 ivo:0 ros:2 loco:1 | score=22 trains=5
Safety: completed=t-exchange-place-downtown-brooklyn, t-flushing-atlantic-terminal | fallback=world-trade -> long-island-city
New weakness: the center can still outscore if left uncontested.

Turn 39 | Blue (central optimizer)
Snapshot: strongest=t-exchange-jamaica weakest=t-long-island-city-downtown-brooklyn completed=1 incomplete=3
Plan: exchange-place -> jamaica | Risk: Newark Penn -> Grove St | Threat: Battery Pk. -> Red Hook
Hand before: cri:1 amb:0 eme:0 cob:1 vio:1 obs:3 ivo:0 ros:0 loco:0 | tickets=4 trains=6 stations=3
Action: claim newark-penn-grove-st with obsidian | Why: 1 ticket(s) complete if claimed. | Result: success (score updated)
Hand after: cri:1 amb:0 eme:0 cob:1 vio:1 obs:1 ivo:0 ros:0 loco:0 | score=23 trains=4
Safety: completed=t-grand-central-flushing | fallback=long-island-city -> downtown-brooklyn
New weakness: outer branches can now press the central spine.

Turn 40 | Red (outer opportunist)
Snapshot: strongest=t-secaucus-jamaica weakest=t-world-trade-long-island-city completed=2 incomplete=2
Plan: secaucus -> jamaica | Risk: no claimable route | Threat: Union Sq. -> Battery Pk.
Hand before: cri:0 amb:0 eme:0 cob:1 vio:1 obs:1 ivo:0 ros:2 loco:1 | tickets=4 trains=5 stations=3
Action: draw card from deck | Second draw: deck | Why: building toward Secaucus -> Penn Dist. rather than over-drawing tickets.
Hand after: cri:0 amb:1 eme:0 cob:1 vio:1 obs:1 ivo:0 ros:2 loco:2 | score=22 trains=5
Safety: completed=t-exchange-place-downtown-brooklyn, t-flushing-atlantic-terminal | fallback=world-trade -> long-island-city
New weakness: the center can still outscore if left uncontested.

Turn 41 | Blue (central optimizer)
Snapshot: strongest=t-exchange-jamaica weakest=t-long-island-city-downtown-brooklyn completed=1 incomplete=3
Plan: exchange-place -> jamaica | Risk: no claimable route | Threat: Battery Pk. -> Red Hook
Hand before: cri:1 amb:0 eme:0 cob:1 vio:1 obs:1 ivo:0 ros:0 loco:0 | tickets=4 trains=4 stations=3
Action: draw card from deck | Second draw: deck | Why: no claimable route yet; kept tempo with cards.
Hand after: cri:1 amb:1 eme:0 cob:1 vio:1 obs:2 ivo:0 ros:0 loco:0 | score=23 trains=4
Safety: completed=t-grand-central-flushing | fallback=long-island-city -> downtown-brooklyn
New weakness: outer branches can now press the central spine.

Turn 42 | Red (outer opportunist)
Snapshot: strongest=t-secaucus-jamaica weakest=t-world-trade-long-island-city completed=2 incomplete=2
Plan: secaucus -> jamaica | Risk: Secaucus -> Penn Dist. | Threat: Union Sq. -> Battery Pk.
Hand before: cri:0 amb:1 eme:0 cob:1 vio:1 obs:1 ivo:0 ros:2 loco:2 | tickets=4 trains=5 stations=3
Action: claim secaucus-midtown-west with cobalt | Why: 2 ticket(s) complete if claimed. | Result: success (score updated)
Hand after: cri:0 amb:1 eme:0 cob:0 vio:1 obs:1 ivo:0 ros:2 loco:0 | score=26 trains=2
Safety: completed=t-exchange-place-downtown-brooklyn, t-flushing-atlantic-terminal | fallback=world-trade -> long-island-city
New weakness: the center can still outscore if left uncontested.

Turn 43 | Blue (central optimizer)
Snapshot: strongest=t-exchange-jamaica weakest=t-long-island-city-downtown-brooklyn completed=1 incomplete=3
Plan: exchange-place -> jamaica | Risk: no claimable route | Threat: Battery Pk. -> Red Hook
Hand before: cri:1 amb:1 eme:0 cob:1 vio:1 obs:2 ivo:0 ros:0 loco:0 | tickets=4 trains=4 stations=3
Action: draw card from deck | Second draw: deck | Why: no claimable route yet; kept tempo with cards.
Hand after: cri:1 amb:1 eme:1 cob:1 vio:1 obs:2 ivo:0 ros:1 loco:0 | score=23 trains=4
Safety: completed=t-grand-central-flushing | fallback=long-island-city -> downtown-brooklyn
New weakness: outer branches can now press the central spine.


Final:
Blue: score=24 trainsLeft=4 stationsLeft=3
  Ticket delta: -21 | Unused stations: +12 | Longest route: 10 trains | Longest route bonus: +10 | Completed tickets: t-grand-central-flushing | Failed tickets: t-exchange-jamaica, t-long-island-city-downtown-brooklyn, t-grand-central-jamaica
  tickets: t-exchange-jamaica, t-grand-central-flushing, t-long-island-city-downtown-brooklyn, t-grand-central-jamaica
Red: score=33 trainsLeft=2 stationsLeft=3
  Ticket delta: -5 | Unused stations: +12 | Longest route: 7 trains | Longest route bonus: +0 | Completed tickets: t-exchange-place-downtown-brooklyn, t-flushing-atlantic-terminal | Failed tickets: t-secaucus-jamaica, t-world-trade-long-island-city
  tickets: t-secaucus-jamaica, t-exchange-place-downtown-brooklyn, t-world-trade-long-island-city, t-flushing-atlantic-terminal