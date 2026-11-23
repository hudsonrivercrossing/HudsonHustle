# v0.5 River Crossings

## Snapshot Summary
- Starts from the frozen `v0.4-flushing-newark-airport` release. Same 20 stations, same 32 routes, same tickets, same rules.
- The layout now follows the basemap: Manhattan stations sit on Manhattan, New Jersey stations on the New Jersey shore, and the routes between them cross the Hudson or the East River where the map shows water.

## Changes From v0.4
- `Hudson Yards`, `Chelsea`, `Exchange Place` and `Grove St` were drawn in the water; they are now on land on the correct side.
- `Battery Park` was drawn on the Brooklyn shore; it is now at the tip of Manhattan.
- `newark-airport-hudson-yards` keeps its length, colour and type. It used to run along the left and top edges of the board, where it read as a frame; it now curves through New Jersey a little inside the edge.
- Board labels show full station names, matching tickets.
- Uses basemap `nyc-hudson-ai-reference-v2.png`: the band that was painted along the left and top edges of v1 is removed.
