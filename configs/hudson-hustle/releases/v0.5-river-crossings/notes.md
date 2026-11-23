# v0.5 River Crossings

## Snapshot Summary
- Starts from the frozen `v0.4-flushing-newark-airport` release. Same 20 stations, same 32 routes, same tickets, same rules.
- The layout now follows the basemap: Manhattan stations sit on Manhattan, New Jersey stations on the New Jersey shore, and the routes between them cross the Hudson or the East River where the map shows water.

## Changes From v0.4
- `Hudson Yards`, `Chelsea`, `Exchange Place` and `Grove St` were drawn in the water; they are now on land on the correct side.
- `Battery Park` was drawn on the Brooklyn shore; it is now at the tip of Manhattan.
- `newark-airport-hudson-yards` keeps its length, colour and type. It used to run along the left and top edges of the board, where it read as a frame; it now curves through New Jersey a little inside the edge.
- Board labels show full station names, matching tickets.
- Uses basemap `nyc-hudson-ai-reference-v2.webp`: the band that was painted along the left and top edges of v1 is removed.

## Space Sizes
- Stations were nudged so the spaces on different routes are closer in size; lengths are unchanged. Downtown Brooklyn and Red Hook sit nearer the harbor mouth, Grove St nearer Hoboken, Newark Penn and Jamaica a little closer in.
- A space was between 46 and 214 map units long; it is now between about 50 and 161, leaving aside the six-space Newark Airport to Hudson Yards route, which is about 205 because it has to go round New Jersey.

## Rules Data Changes From v0.4
These change play, not only the drawing. v0.4 keeps the old values.
- Nine routes are one space longer, mostly the ones whose spaces were drawn longest: Battery Park to Downtown Brooklyn (3), Battery Park to Red Hook (3), Atlantic Terminal to Jamaica (3), Secaucus to Newark Penn (4), Secaucus to Penn District (4), Grand Central to Jamaica (5), Flushing to Jamaica (4), Union Square to Williamsburg (4), Hoboken to Grove St (3). The board goes from 82 spaces to 91, and from two routes of length four or more to seven.
- Two more ferries, each needing one locomotive: Hoboken to Chelsea, and the rose Exchange Place to World Trade twin. The gray twin stays a tunnel, so the pair is a choice between a tunnel and a ferry.
- Four tickets were finished by claiming a single two-space route for five points. They now ask for more: Atlantic Terminal to Union Square (9), Battery Park to Williamsburg (6), Hoboken to Red Hook (11), Chelsea to Williamsburg (7). Williamsburg had no ticket before.
