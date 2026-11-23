# Fonts

Both files are the Latin subset as served by Google Fonts, kept here so the app loads them from its
own address instead of a third party.

| File | Family | Axes | Source |
|---|---|---|---|
| `fraunces-latin.woff2` | Fraunces | weight 100–900, optical size 9–144 | https://fonts.google.com/specimen/Fraunces |
| `ibm-plex-sans-latin.woff2` | IBM Plex Sans | weight 100–700 | https://fonts.google.com/specimen/IBM+Plex+Sans |

Both families are published under the SIL Open Font License 1.1, which allows bundling them with
software. The Latin subset has no arrows; `→` falls back to the system font, as it did before.

## Chinese names on the Henan map

| File | Family | Weights it serves | Source |
|---|---|---|---|
| `lxgw-wenkai-henan-regular.woff2` | LXGW WenKai (霞鹜文楷) Regular | 100–500 | https://github.com/lxgw/LxgwWenKai v1.530 |
| `lxgw-wenkai-henan-medium.woff2` | LXGW WenKai (霞鹜文楷) Medium | 600–900 | https://github.com/lxgw/LxgwWenKai v1.530 |

These hold only the Chinese characters the Henan map shows: its station names, its name, its route type
names and the names written on its basemap. Any other Chinese character is drawn in the system's font.
After adding a station or a basemap name, cut them again with `scripts/config/henan-font-subset.mjs`.
LXGW WenKai is under the SIL Open Font License 1.1 (`lxgw-wenkai-OFL.txt`), which allows a subset
converted to woff2 for web delivery to keep the name.
