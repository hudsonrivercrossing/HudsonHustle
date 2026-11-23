# Balance simulation — 河南 · 大河中原 (henan)

Generated 2026-11-23 by `scripts/sim/balance-sim.mjs`. Every seat is the same deterministic bot.
Read this as how the map behaves under that one policy. It finds dead routes and unreachable tickets; it does not predict human play.

Map: 25 stations, 43 routes, 50 tickets, 30 trains per player.

## Games

| Players | Seeds | Finished | Stuck | Crashed | Mean score | Mean spread (first − last) | Mean actions | Stations built per player |
|---|---|---|---|---|---|---|---|---|
| 2 | 300 | 300 | 0 | 0 | 74.1 | 23.4 | 103 | 0.00 |
| 3 | 300 | 300 | 0 | 0 | 62.2 | 46.2 | 151 | 0.00 |
| 4 | 300 | 300 | 0 | 0 | 58.8 | 54.3 | 197 | 0.00 |

## Seat order

Share of outright wins by seat. An even table would give each seat the same share.

| Players | Seat 1 | Seat 2 | Seat 3 | Seat 4 | Ties |
|---|---|---|---|---|---|
| 2 | 48% | 49% |  |  | 2% |
| 3 | 35% | 34% | 30% |  | 1% |
| 4 | 30% | 25% | 20% | 22% | 2% |

## Routes

How often each route ends the game claimed. Sorted by the average across player counts, least used first.

| Route | Length | Color | Type | 2p | 3p | 4p |
|---|---|---|---|---|---|---|
| 洛阳 – 三门峡 | 4 | amber | tunnel | 0% | 0% | 56% |
| 驻马店 – 漯河 | 2 | rose | normal | 0% | 0% | 79% |
| 郑州 – 许昌 | 2 | ivory | normal | 0% | 0% | 85% |
| 红旗渠 – 鹤壁 | 2 | violet | tunnel | 12% | 27% | 48% |
| 安阳 – 红旗渠 | 3 | gray | tunnel | 3% | 19% | 67% |
| 郑州 – 开封 | 2 | cobalt | normal | 0% | 0% | 95% |
| 郑州 – 新乡 | 2 | violet | ferry | 0% | 0% | 96% |
| 三门峡 – 老君山 | 3 | gray | tunnel | 13% | 36% | 49% |
| 南阳 – 信阳 | 5 | obsidian | tunnel | 16% | 37% | 50% |
| 少林寺 – 洛阳 | 2 | gray | tunnel | 9% | 37% | 61% |
| 老君山 – 西峡 | 2 | gray | tunnel | 9% | 43% | 71% |
| 郑州 – 周口 | 5 | emerald | normal | 13% | 43% | 70% |
| 信阳 – 鸡公山 | 2 | gray | tunnel | 29% | 45% | 59% |
| 洛阳 – 老君山 | 3 | gray | tunnel | 20% | 65% | 81% |
| 新乡 – 濮阳 | 5 | emerald | normal | 39% | 55% | 76% |
| 洛阳 – 济源 | 2 | cobalt | ferry | 32% | 63% | 81% |
| 云台山 – 焦作 | 2 | ivory | normal | 30% | 70% | 81% |
| 焦作 – 济源 | 2 | crimson | normal | 31% | 67% | 92% |
| 濮阳 – 安阳 | 3 | ivory | normal | 42% | 70% | 91% |
| 新乡 – 云台山 | 2 | obsidian | normal | 39% | 79% | 93% |
| 兰考 – 濮阳 | 4 | crimson | ferry | 60% | 75% | 81% |
| 许昌 – 平顶山 | 3 | cobalt | normal | 53% | 70% | 94% |
| 郑州 – 焦作 | 3 | rose | ferry | 43% | 82% | 93% |
| 西峡 – 南阳 | 4 | rose | normal | 61% | 76% | 87% |
| 郑州 – 少林寺 | 3 | gray | normal | 49% | 82% | 97% |
| 周口 – 商丘 | 4 | ivory | normal | 63% | 81% | 90% |
| 安阳 – 鹤壁 | 2 | cobalt | normal | 57% | 84% | 95% |
| 漯河 – 周口 | 2 | crimson | normal | 65% | 89% | 94% |
| 商丘 – 兰考 | 3 | rose | normal | 69% | 85% | 95% |
| 郑州 – 平顶山 | 4 | violet | normal | 72% | 88% | 96% |
| 洛阳 – 三门峡 | 4 | emerald | normal | 75% | 87% | 96% |
| 漯河 – 许昌 | 2 | obsidian | normal | 75% | 85% | 100% |
| 兰考 – 开封 | 2 | obsidian | normal | 72% | 89% | 99% |
| 郑州 – 洛阳 | 4 | obsidian | normal | 71% | 92% | 99% |
| 鹤壁 – 新乡 | 2 | amber | normal | 70% | 94% | 98% |
| 洛阳 – 平顶山 | 3 | crimson | normal | 72% | 94% | 99% |
| 平顶山 – 南阳 | 3 | ivory | normal | 77% | 92% | 99% |
| 漯河 – 平顶山 | 3 | amber | normal | 79% | 92% | 98% |
| 信阳 – 驻马店 | 2 | cobalt | normal | 80% | 94% | 99% |
| 郑州 – 许昌 | 2 | crimson | normal | 85% | 95% | 99% |
| 驻马店 – 漯河 | 2 | violet | normal | 84% | 98% | 100% |
| 郑州 – 开封 | 2 | amber | normal | 88% | 98% | 100% |
| 郑州 – 新乡 | 2 | emerald | ferry | 92% | 99% | 100% |

## Tickets

Of the times a ticket was held at the end of a game, how often it was completed. Hardest first.

| Ticket | Points | Kind | 2p done / held | 3p done / held | 4p done / held |
|---|---|---|---|---|---|
| 漯河 – 濮阳 | 11 | regular | 58% of 97 | 39% of 128 | 41% of 165 |
| 安阳 – 信阳 | 14 | long | 83% of 83 | 41% of 122 | 31% of 162 |
| 西峡 – 洛阳 | 5 | regular | 25% of 4 | 40% of 25 | 59% of 46 |
| 开封 – 信阳 | 10 | regular | 72% of 78 | 44% of 111 | 46% of 145 |
| 焦作 – 周口 | 8 | regular | 55% of 58 | 53% of 111 | 49% of 135 |
| 新乡 – 南阳 | 9 | regular | 70% of 61 | 47% of 91 | 49% of 130 |
| 安阳 – 开封 | 8 | regular | 74% of 61 | 48% of 101 | 54% of 139 |
| 驻马店 – 南阳 | 7 | regular | 64% of 33 | 53% of 64 | 57% of 86 |
| 老君山 – 南阳 | 6 | regular | 71% of 14 | 51% of 39 | 61% of 62 |
| 濮阳 – 许昌 | 9 | regular | 68% of 74 | 51% of 109 | 61% of 166 |
| 少林寺 – 信阳 | 11 | regular | 83% of 78 | 61% of 122 | 46% of 147 |
| 新乡 – 商丘 | 9 | regular | 77% of 70 | 48% of 110 | 61% of 142 |
| 开封 – 周口 | 7 | regular | 68% of 38 | 54% of 57 | 62% of 109 |
| 驻马店 – 开封 | 8 | regular | 71% of 45 | 56% of 55 | 61% of 114 |
| 洛阳 – 商丘 | 11 | regular | 79% of 75 | 65% of 134 | 54% of 177 |
| 鸡公山 – 郑州 | 10 | regular | 74% of 69 | 60% of 115 | 60% of 157 |
| 西峡 – 平顶山 | 7 | regular | 76% of 34 | 64% of 69 | 59% of 88 |
| 兰考 – 新乡 | 6 | regular | 71% of 55 | 58% of 78 | 68% of 115 |
| 济源 – 许昌 | 7 | regular | 74% of 54 | 65% of 92 | 62% of 124 |
| 鹤壁 – 焦作 | 6 | regular | 56% of 36 | 73% of 59 | 68% of 73 |
| 焦作 – 平顶山 | 7 | regular | 72% of 61 | 72% of 98 | 61% of 121 |
| 鹤壁 – 洛阳 | 8 | regular | 78% of 65 | 72% of 109 | 59% of 135 |
| 许昌 – 商丘 | 8 | regular | 85% of 59 | 63% of 82 | 63% of 132 |
| 周口 – 洛阳 | 8 | regular | 79% of 70 | 73% of 116 | 59% of 146 |
| 濮阳 – 南阳 | 14 | long | 94% of 47 | 69% of 62 | 54% of 85 |
| 老君山 – 郑州 | 7 | regular | 73% of 26 | 68% of 78 | 73% of 92 |
| 三门峡 – 济源 | 6 | regular | 73% of 26 | 70% of 61 | 71% of 89 |
| 开封 – 濮阳 | 6 | regular | 70% of 23 | 67% of 48 | 74% of 74 |
| 周口 – 信阳 | 6 | regular | 88% of 51 | 77% of 84 | 59% of 93 |
| 红旗渠 – 新乡 | 4 | regular | 63% of 16 | 74% of 43 | 75% of 55 |
| 郑州 – 南阳 | 7 | regular | 88% of 56 | 76% of 89 | 63% of 109 |
| 鸡公山 – 漯河 | 6 | regular | 90% of 29 | 72% of 69 | 68% of 79 |
| 红旗渠 – 郑州 | 6 | regular | 85% of 27 | 77% of 53 | 67% of 86 |
| 云台山 – 安阳 | 6 | regular | 78% of 32 | 72% of 69 | 73% of 70 |
| 郑州 – 信阳 | 8 | regular | 82% of 65 | 77% of 117 | 69% of 142 |
| 郑州 – 三门峡 | 8 | regular | 82% of 60 | 71% of 121 | 75% of 166 |
| 济源 – 郑州 | 5 | regular | 79% of 28 | 74% of 68 | 75% of 68 |
| 三门峡 – 平顶山 | 7 | regular | 83% of 53 | 67% of 89 | 78% of 122 |
| 云台山 – 开封 | 6 | regular | 80% of 40 | 75% of 60 | 74% of 96 |
| 安阳 – 三门峡 | 14 | long | 86% of 51 | 72% of 81 | 73% of 109 |
| 商丘 – 南阳 | 12 | long | 77% of 43 | 74% of 62 | 76% of 83 |
| 平顶山 – 信阳 | 7 | regular | 84% of 51 | 75% of 93 | 74% of 107 |
| 郑州 – 商丘 | 7 | regular | 81% of 52 | 79% of 103 | 74% of 120 |
| 洛阳 – 新乡 | 6 | regular | 81% of 31 | 73% of 81 | 82% of 100 |
| 三门峡 – 信阳 | 14 | long | 87% of 55 | 77% of 81 | 76% of 106 |
| 三门峡 – 商丘 | 15 | long | 83% of 52 | 80% of 90 | 77% of 123 |
| 少林寺 – 开封 | 5 | regular | 91% of 22 | 75% of 48 | 87% of 63 |
| 漯河 – 商丘 | 6 | regular | 86% of 43 | 88% of 64 | 79% of 70 |
| 洛阳 – 开封 | 6 | regular | 88% of 41 | 80% of 60 | 86% of 99 |
| 郑州 – 安阳 | 6 | regular | 92% of 37 | 86% of 70 | 82% of 106 |
