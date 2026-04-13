# Berlin Draft 01

## Snapshot Summary
- This draft creates the first Berlin map snapshot for Hudson Hustle.
- It is a compact, playable, real-network-informed first pass rather than a literal full Berlin system map.
- The snapshot reuses the current Hudson Hustle rules and visual token system so the work stays focused on graph quality and ticket structure.

## Candidate Pool
- The full Berlin station pool supplied for this draft is:
  - `Flughafen BER`
  - `Ostkreuz`
  - `Suedkreuz`
  - `Westkreuz`
  - `Gesundbrunnen`
  - `Hauptbahnhof`
  - `Alexanderplatz`
  - `Brandenburger Tor`
  - `Zoologischer Garten`
  - `Wannsee`
  - `Spandau`
  - `Olympiastadion`
  - `Westhafen`
  - `Wedding`
  - `Pankow`
  - `Schoenhauser Allee`
  - `Friedrichstrasse`
  - `Frankfurter Allee`
  - `Sonnenallee`
  - `Tempelhof`
  - `Hermannplatz`

## Active First-Pass Set
- Draft one activates these `16` stations:
  - `Flughafen BER`
  - `Ostkreuz`
  - `Suedkreuz`
  - `Westkreuz`
  - `Gesundbrunnen`
  - `Hauptbahnhof`
  - `Alexanderplatz`
  - `Brandenburger Tor`
  - `Zoologischer Garten`
  - `Wannsee`
  - `Spandau`
  - `Wedding`
  - `Schoenhauser Allee`
  - `Friedrichstrasse`
  - `Tempelhof`
  - `Hermannplatz`

## Deferred Stations
- These remain in the snapshot but are intentionally inactive:
  - `Olympiastadion`
  - `Westhafen`
  - `Pankow`
  - `Frankfurter Allee`
  - `Sonnenallee`
- They are parked as later-wave candidates rather than discarded.

## Route Strategy
- The route graph is inferred from major Berlin interchange relationships and compressed for board play.
- Draft one emphasizes:
  - west access through `Spandau`, `Westkreuz`, and `Zoologischer Garten`
  - a dense central trunk through `Hauptbahnhof`, `Brandenburger Tor`, `Friedrichstrasse`, and `Alexanderplatz`
  - a north layer through `Gesundbrunnen`, `Wedding`, and `Schoenhauser Allee`
  - a south and airport arc through `Suedkreuz`, `Tempelhof`, `Hermannplatz`, `Ostkreuz`, and `Flughafen BER`
- Tunnel routes are concentrated in the dense core and the airport run.
- Draft one avoids ferries entirely.

## Ticket Strategy
- The long ticket deck pushes broad west-east, north-south, and airport-crossing objectives.
- The regular ticket deck focuses on:
  - west-to-core access
  - north-core connectors
  - central transfer pressure
  - airport access through south and east approaches

## Visual and Rules Defaults
- Rules are inherited unchanged from the current `v0.4` release.
- Visuals intentionally remain minimal:
  - same theme
  - same token palettes
  - no Berlin-specific backdrop art yet

## Known Gaps
- Station authority metadata uses `station-proxy` references in draft one.
- Some inactive candidates may prove stronger than current active nodes after playtest.
- Berlin-specific backdrop and palette work is intentionally deferred until the graph and ticket structure stabilize.
