# Balance simulation — Berlin 1961 (berlin)

Generated 2026-11-22 by `scripts/sim/balance-sim.mjs`. Every seat is the same deterministic bot.
Read this as how the map behaves under that one policy. It finds dead routes and unreachable tickets; it does not predict human play.

Map: 25 stations, 38 routes, 39 tickets, 28 trains per player.

## Games

| Players | Seeds | Finished | Stuck | Crashed | Mean score | Mean spread (first − last) | Mean actions | Stations built per player |
|---|---|---|---|---|---|---|---|---|
| 2 | 1000 | 1000 | 0 | 0 | 26.8 | 12.1 | 81 | 0.00 |
| 3 | 1000 | 1000 | 0 | 0 | 26.3 | 17.7 | 128 | 0.00 |
| 4 | 1000 | 1000 | 0 | 0 | 25.2 | 21.9 | 179 | 0.00 |

## Seat order

Share of outright wins by seat. An even table would give each seat the same share.

| Players | Seat 1 | Seat 2 | Seat 3 | Seat 4 | Ties |
|---|---|---|---|---|---|
| 2 | 50% | 49% |  |  | 2% |
| 3 | 34% | 34% | 29% |  | 3% |
| 4 | 23% | 25% | 25% | 22% | 4% |

## Routes

How often each route ends the game claimed. Sorted by the average across player counts, least used first.

| Route | Length | Color | Type | 2p | 3p | 4p |
|---|---|---|---|---|---|---|
| Suedkreuz – Flughafen BER | 5 | cobalt | Border Crossing | 2% | 23% | 84% |
| Wannsee – Suedkreuz | 4 | obsidian | normal | 4% | 24% | 89% |
| Neukoelln – Flughafen BER | 4 | obsidian | Border Crossing | 7% | 39% | 94% |
| Hauptbahnhof – Friedrichstrasse | 2 | cobalt | Border Crossing | 16% | 30% | 97% |
| Neukoelln – Tempelhof | 4 | violet | normal | 8% | 48% | 94% |
| Friedrichstrasse – Alexanderplatz | 2 | emerald | normal | 34% | 32% | 100% |
| Hauptbahnhof – Friedrichstrasse | 2 | rose | Border Crossing | 24% | 45% | 98% |
| Schoenberg – Westkreuz | 3 | emerald | normal | 23% | 78% | 98% |
| Spandau – Jungfernheide | 4 | rose | normal | 28% | 74% | 99% |
| Ostkreuz – Hermannplatz | 3 | violet | Border Crossing | 34% | 69% | 98% |
| Hauptbahnhof – Brandenburger Tor | 2 | crimson | Border Crossing | 27% | 76% | 100% |
| Schoenhauser Allee – Frankfurter Allee | 3 | ivory | normal | 26% | 83% | 99% |
| Gesundbrunnen – Friedrichstrasse | 3 | amber | Border Crossing | 33% | 84% | 99% |
| Friedrichstrasse – Alexanderplatz | 2 | violet | normal | 65% | 68% | 100% |
| Gesundbrunnen – Schoenhauser Allee | 2 | rose | Border Crossing | 54% | 88% | 100% |
| Wedding – Hauptbahnhof | 2 | amber | normal | 53% | 93% | 100% |
| Westkreuz – Jungfernheide | 3 | obsidian | normal | 56% | 93% | 100% |
| Zoologischer Garten – Hauptbahnhof | 2 | emerald | normal | 62% | 96% | 100% |
| Potsdamer Platz – Suedkreuz | 3 | gray | Border Crossing | 62% | 96% | 100% |
| Schoenhauser Allee – Pankow | 2 | emerald | normal | 70% | 99% | 100% |
| Zoologischer Garten – Westkreuz | 2 | ivory | normal | 74% | 99% | 100% |
| Suedkreuz – Schoenberg | 2 | amber | normal | 76% | 98% | 100% |
| Westkreuz – Olympiastadion | 2 | violet | normal | 78% | 100% | 100% |
| Olympiastadion – Spandau | 2 | amber | normal | 80% | 99% | 100% |
| Westhafen – Wedding | 2 | crimson | normal | 82% | 99% | 100% |
| Ostkreuz – Neukoelln | 3 | gray | Border Crossing | 88% | 99% | 100% |
| Jungfernheide – Westhafen | 2 | cobalt | normal | 89% | 100% | 100% |
| Hermannplatz – Tempelhof | 2 | emerald | normal | 92% | 100% | 100% |
| Westkreuz – Wannsee | 3 | gray | normal | 92% | 100% | 100% |
| Tempelhof – Suedkreuz | 2 | ivory | normal | 93% | 100% | 100% |
| Friedrichstrasse – Brandenburger Tor | 2 | amber | Border Crossing | 94% | 100% | 100% |
| Warschauer Strasse – Ostkreuz | 2 | obsidian | normal | 95% | 100% | 100% |
| Hauptbahnhof – Potsdamer Platz | 2 | ivory | Border Crossing | 96% | 100% | 100% |
| Gesundbrunnen – Wedding | 2 | violet | normal | 96% | 100% | 100% |
| Frankfurter Allee – Ostkreuz | 2 | crimson | normal | 98% | 100% | 100% |
| Alexanderplatz – Schoenhauser Allee | 2 | cobalt | normal | 99% | 100% | 100% |
| Alexanderplatz – Warschauer Strasse | 2 | rose | normal | 99% | 100% | 100% |
| Potsdamer Platz – Brandenburger Tor | 2 | gray | Border Crossing | 100% | 100% | 100% |

## Tickets

Of the times a ticket was held at the end of a game, how often it was completed. Hardest first.

| Ticket | Points | Kind | 2p done / held | 3p done / held | 4p done / held |
|---|---|---|---|---|---|
| Brandenburger Tor – Alexanderplatz | 4 | regular | never held | never held | never held |
| Warschauer Strasse – Spandau | 10 | regular | 0% of 148 | 0% of 214 | 0% of 292 |
| Warschauer Strasse – Westkreuz | 8 | regular | 0% of 96 | 0% of 149 | 0% of 190 |
| Pankow – Flughafen BER | 14 | long | 0% of 301 | 0% of 454 | 0% of 616 |
| Jungfernheide – Ostkreuz | 9 | regular | 0% of 99 | 1% of 146 | 0% of 192 |
| Spandau – Flughafen BER | 15 | long | 0% of 299 | 0% of 485 | 1% of 651 |
| Spandau – Hermannplatz | 12 | long | 1% of 313 | 1% of 461 | 0% of 615 |
| Schoenhauser Allee – Flughafen BER | 13 | long | 1% of 310 | 1% of 455 | 0% of 607 |
| Schoenberg – Alexanderplatz | 7 | regular | 4% of 70 | 1% of 106 | 0% of 138 |
| Gesundbrunnen – Hermannplatz | 9 | regular | 1% of 136 | 3% of 194 | 1% of 260 |
| Wannsee – Ostkreuz | 13 | long | 0% of 282 | 1% of 453 | 3% of 603 |
| Neukoelln – Hauptbahnhof | 8 | regular | 4% of 70 | 2% of 107 | 1% of 137 |
| Hauptbahnhof – Hermannplatz | 7 | regular | 3% of 63 | 3% of 101 | 1% of 133 |
| Frankfurter Allee – Suedkreuz | 8 | regular | 2% of 121 | 5% of 177 | 1% of 244 |
| Gesundbrunnen – Wannsee | 12 | long | 3% of 352 | 4% of 481 | 1% of 632 |
| Olympiastadion – Friedrichstrasse | 8 | regular | 4% of 113 | 5% of 170 | 1% of 217 |
| Spandau – Hauptbahnhof | 8 | regular | 6% of 105 | 6% of 161 | 2% of 234 |
| Pankow – Hauptbahnhof | 7 | regular | 6% of 71 | 5% of 95 | 4% of 114 |
| Alexanderplatz – Hermannplatz | 6 | regular | 17% of 23 | 5% of 38 | 4% of 50 |
| Hermannplatz – Flughafen BER | 9 | regular | 0% of 136 | 7% of 215 | 11% of 265 |
| Tempelhof – Flughafen BER | 8 | regular | 0% of 115 | 5% of 169 | 13% of 219 |
| Ostkreuz – Flughafen BER | 8 | regular | 2% of 82 | 6% of 132 | 11% of 188 |
| Friedrichstrasse – Ostkreuz | 7 | regular | 12% of 49 | 11% of 66 | 4% of 90 |
| Westkreuz – Tempelhof | 8 | regular | 5% of 94 | 11% of 156 | 9% of 220 |
| Brandenburger Tor – Tempelhof | 6 | regular | 24% of 34 | 12% of 51 | 7% of 70 |
| Schoenhauser Allee – Ostkreuz | 5 | regular | 29% of 45 | 20% of 71 | 11% of 98 |
| Ostkreuz – Tempelhof | 6 | regular | 16% of 55 | 17% of 81 | 21% of 122 |
| Westkreuz – Hauptbahnhof | 7 | regular | 19% of 83 | 24% of 119 | 25% of 159 |
| Wannsee – Zoologischer Garten | 6 | regular | 46% of 41 | 30% of 63 | 12% of 81 |
| Wannsee – Suedkreuz | 8 | regular | 7% of 98 | 22% of 143 | 42% of 193 |
| Zoologischer Garten – Friedrichstrasse | 6 | regular | 44% of 34 | 27% of 55 | 26% of 70 |
| Potsdamer Platz – Alexanderplatz | 5 | regular | 50% of 2 | 50% of 2 | 0% of 2 |
| Spandau – Westkreuz | 5 | regular | 38% of 45 | 36% of 66 | 31% of 85 |
| Gesundbrunnen – Alexanderplatz | 7 | regular | 45% of 56 | 31% of 85 | 33% of 112 |
| Friedrichstrasse – Schoenhauser Allee | 5 | regular | 50% of 6 | 50% of 8 | 20% of 10 |
| Zoologischer Garten – Brandenburger Tor | 5 | regular | 60% of 10 | 36% of 14 | 39% of 18 |
| Gesundbrunnen – Hauptbahnhof | 5 | regular | 50% of 22 | 55% of 31 | 37% of 35 |
| Hauptbahnhof – Alexanderplatz | 5 | regular | 38% of 8 | 50% of 10 | 50% of 14 |
| Wedding – Brandenburger Tor | 5 | regular | 38% of 13 | 69% of 16 | 42% of 24 |
