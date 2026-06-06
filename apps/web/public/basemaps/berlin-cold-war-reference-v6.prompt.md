# Berlin Cold War basemap — v6 prompt

Image-generation prompt for the Berlin Cold War reference basemap. Paired with `berlin-cold-war-reference-v6.png` once generated.

Changes from v5:
- Fixed north red-line segment so Gesundbrunnen ends up in the French sector
- Expanded French sector to cover the entire northwest including Gesundbrunnen and Reinickendorf
- Made British sector tint clearly visible and expanded to cover Spandau, Olympiastadion, Westkreuz
- Tightened red line south bulge around Neukölln
- Kept sector text labels ("FRENCH SECTOR" / "BRITISH SECTOR" / "AMERICAN SECTOR" / "SOVIET SECTOR")

---

## Prompt

A vintage espionage-era map of divided Berlin, rendered as a declassified intelligence document on aged, slightly yellowed paper with worn, foxed edges. Hand-drawn ink cartography crossed with mid-century military briefing aesthetic. Top-down orthographic view. Aspect ratio 4:3.

### Four occupation zones, separated by a single bold red line between Soviet and Western sectors

Only **one prominent boundary** — the oxidized iron-red hand-inked line between the Soviet sector and the three Western sectors. The three Western sectors are separated only by **very faint dashed graphite lines** that are readable on close inspection but never compete with the red line.

### Sector background colors

- **Soviet Sector (East Berlin)** — smoky blue-grey with a faint olive-drab cast. Evokes Soviet topographic charts, cigarette smoke, concrete, cyanotype. Covers the entire eastern half.
- **French Sector (northwest)** — dusty pink-lavender, faded. Covers the entire northwest: Reinickendorf, Wedding, Gesundbrunnen, Westhafen, Jungfernheide. Reaches the top edge of the map and extends east to the red boundary.
- **British Sector (central-west)** — cool grey-ivory, clearly distinct from bare paper. Covers Charlottenburg, Tiergarten, Wilmersdorf, Spandau. Must visibly tint **Spandau, Olympiastadion, Westkreuz, Zoo** and the central-west belt.
- **American Sector (south and southwest)** — warm cream-yellow. Covers Schöneberg, Tempelhof, Neukölln, Kreuzberg, Steglitz, Zehlendorf, Wannsee. Must include **Schöneberg, Tempelhof, Südkreuz, Wannsee, Potsdamer Platz, Hermannplatz, Neukölln**.

Three Western sector tints stay subtle (low saturation) but clearly distinguishable on close inspection.

### Red boundary path (Soviet vs Western sectors) — historically accurate, 1961–1989 Berlin Wall trace

- **North segment:** runs from the top edge of the map **east of Gesundbrunnen**, so Gesundbrunnen sits firmly on the French (pink) side. Curves southwest past Bernauer Straße and Wedding's east edge.
- **Central segment:** passes east of Brandenburger Tor (gate hugs the East side of the line) and east of Potsdamer Platz.
- **South segment:** bends east **tightly** along the Neukölln eastern district edge — do not bulge far into Treptow. Then curves back **southwest** toward the Teltow Canal area, keeping Neukölln, Hermannplatz, and Tempelhof firmly in the American (cream-yellow) sector.
- **Southwest:** closes around the southern edge of the American sector.

### Inter-Western boundaries (very faint dashed graphite, low opacity)

- **French / British boundary** — east-west line roughly along the Westhafen-Kanal, separating Reinickendorf/Wedding (north, French) from Charlottenburg/Tiergarten (south, British).
- **British / American boundary** — east-west line roughly along the Landwehrkanal, separating Tiergarten/Charlottenburg (north, British) from Schöneberg/Kreuzberg (south, American).

Both dashed lines should be ghost-like — present but never visually competing with the red Soviet/Western line.

### Sector text labels (KEEP)

Large restrained serif text labels in each sector, slightly faded into the background:

- **FRENCH SECTOR** — centered in the northwest pink zone
- **BRITISH SECTOR** — centered in the central-west grey-ivory zone
- **AMERICAN SECTOR** — centered in the southern cream-yellow zone
- **SOVIET SECTOR** — centered in the eastern blue-grey zone

Type style: classic mid-century military map serif, all caps, letter-spaced, low contrast so the labels feel integrated into the paper rather than overlaid.

### Station color assignments (each label sits on its correct sector color)

**French Sector (pink-lavender):**
Wedding, Gesundbrunnen, Westhafen, Jungfernheide.

**British Sector (cool grey-ivory):**
Spandau, Olympiastadion, Westkreuz, Zoo.

**American Sector (warm cream-yellow):**
Wannsee, Schöneberg, Tempelhof, Südkreuz, Potsdamer Platz, Hermannplatz, Neukölln.

**Soviet Sector (blue-grey / olive):**
Pankow, Schoenhauser, Alexanderplatz, Friedrichstrasse, Brandenburger Tor (hugging east side of boundary), Frankfurter Allee, Warschauer, Ostkreuz.

**Boundary-adjacent:** Hauptbahnhof sits on or near the red boundary; render it on the West side or directly on the line.

### Geography

- The Spree in tarnished steel-blue, meandering west-to-east with its characteristic loop around Spreebogen and Museum Island.
- Havel river and lakes in the far west, same tarnished blue.
- Tiergarten as a muted moss-green park in the western center.
- Tempelhofer Feld as a pale ochre oval in the south.
- Grunewald forest as smoky stippled tree texture in the southwest.
- Volkspark Friedrichshain and Treptower Park as deeper olive shapes in the east.

### Street network

- Sepia-to-graphite ink street lines, slightly smudged, denser in the core, sparser in outer districts.
- Major boulevards thicker (Unter den Linden, Kurfürstendamm, Karl-Marx-Allee).
- A few faint registration crosshairs and corner ticks, as if printed from a classified plate.

### Mood and palette

- Overall: tobacco-stained paper, iron oxide, smoked glass, faded propaganda poster.
- Color story: bone-ivory, dusty rose, dusty pink-lavender, cool grey-ivory, cream-yellow, olive-drab, slate-blue, oxidized red, graphite.
- Subtle paper grain, foxing spots, faint coffee-ring stain in one corner.
- Evokes: John le Carré, *The Lives of Others*, Checkpoint Charlie postcards, declassified CIA Berlin Operations Base maps, 1961 situation reports.
- Optional micro-detail: small cross-tick markers at Bernauer Straße, Brandenburger Tor, and Checkpoint Charlie locations as historical landmark hints.
- A faint compass mark in one corner is acceptable.
- Station labels in restrained serif type, kept on the correct sector color background.
