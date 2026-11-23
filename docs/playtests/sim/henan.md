# Balance simulation — 河南 · 大河中原 (henan)

Generated 2026-11-23 by `scripts/sim/balance-sim.mjs`. Every seat is the same deterministic bot.
Read this as how the map behaves under that one policy. It finds dead routes and unreachable tickets; it does not predict human play.

Map: 26 stations, 45 routes, 50 tickets, 30 trains per player.

## Games

| Players | Seeds | Finished | Stuck | Crashed | Mean score | Mean spread (first − last) | Mean actions | Stations built per player |
|---|---|---|---|---|---|---|---|---|
| 2 | 300 | 300 | 0 | 0 | 73.8 | 23.0 | 102 | 0.00 |
| 3 | 300 | 300 | 0 | 0 | 63.9 | 42.3 | 150 | 0.00 |
| 4 | 300 | 300 | 0 | 0 | 61.3 | 51.8 | 195 | 0.00 |

## Seat order

Share of outright wins by seat. An even table would give each seat the same share.

| Players | Seat 1 | Seat 2 | Seat 3 | Seat 4 | Ties |
|---|---|---|---|---|---|
| 2 | 53% | 44% |  |  | 2% |
| 3 | 34% | 34% | 31% |  | 1% |
| 4 | 28% | 26% | 25% | 19% | 2% |

## Routes

How often each route ends the game claimed. Sorted by the average across player counts, least used first.

| Route | Length | Color | Type | 2p | 3p | 4p |
|---|---|---|---|---|---|---|
| 洛阳 – 三门峡 | 4 | amber | tunnel | 0% | 0% | 45% |
| 驻马店 – 漯河 | 2 | rose | normal | 0% | 0% | 58% |
| 安阳 – 红旗渠 | 3 | gray | tunnel | 5% | 15% | 46% |
| 红旗渠 – 鹤壁 | 2 | violet | tunnel | 14% | 25% | 36% |
| 三门峡 – 老君山 | 3 | gray | tunnel | 12% | 32% | 31% |
| 郑州 – 许昌 | 2 | ivory | normal | 0% | 0% | 79% |
| 郑州 – 开封 | 2 | cobalt | normal | 0% | 0% | 90% |
| 南阳 – 信阳 | 5 | obsidian | tunnel | 12% | 30% | 49% |
| 少林寺 – 洛阳 | 2 | gray | tunnel | 9% | 26% | 57% |
| 郑州 – 新乡 | 2 | violet | ferry | 0% | 0% | 94% |
| 老君山 – 西峡 | 2 | gray | tunnel | 8% | 34% | 54% |
| 商丘 – 潢川 | 6 | violet | normal | 24% | 35% | 49% |
| 信阳 – 鸡公山 | 2 | gray | tunnel | 27% | 37% | 54% |
| 郑州 – 周口 | 5 | emerald | normal | 12% | 43% | 66% |
| 洛阳 – 老君山 | 3 | gray | tunnel | 22% | 59% | 62% |
| 洛阳 – 济源 | 2 | cobalt | ferry | 26% | 54% | 76% |
| 云台山 – 焦作 | 2 | ivory | normal | 32% | 60% | 77% |
| 新乡 – 濮阳 | 5 | emerald | normal | 36% | 57% | 79% |
| 焦作 – 济源 | 2 | crimson | normal | 31% | 60% | 85% |
| 濮阳 – 安阳 | 3 | ivory | normal | 37% | 66% | 85% |
| 许昌 – 平顶山 | 3 | cobalt | normal | 39% | 63% | 87% |
| 信阳 – 潢川 | 4 | amber | normal | 50% | 67% | 74% |
| 西峡 – 南阳 | 4 | rose | normal | 49% | 68% | 80% |
| 新乡 – 云台山 | 2 | obsidian | normal | 42% | 76% | 83% |
| 兰考 – 濮阳 | 4 | crimson | ferry | 53% | 77% | 77% |
| 郑州 – 少林寺 | 3 | gray | normal | 42% | 69% | 96% |
| 郑州 – 焦作 | 3 | rose | ferry | 50% | 74% | 87% |
| 郑州 – 平顶山 | 4 | violet | normal | 61% | 82% | 90% |
| 安阳 – 鹤壁 | 2 | cobalt | normal | 57% | 81% | 95% |
| 漯河 – 周口 | 2 | crimson | normal | 62% | 81% | 93% |
| 周口 – 商丘 | 4 | ivory | normal | 62% | 83% | 92% |
| 漯河 – 平顶山 | 3 | amber | normal | 67% | 89% | 91% |
| 漯河 – 许昌 | 2 | obsidian | normal | 72% | 80% | 96% |
| 商丘 – 兰考 | 3 | rose | normal | 65% | 89% | 96% |
| 平顶山 – 南阳 | 3 | ivory | normal | 67% | 88% | 97% |
| 洛阳 – 平顶山 | 3 | crimson | normal | 66% | 91% | 95% |
| 兰考 – 开封 | 2 | obsidian | normal | 64% | 91% | 99% |
| 洛阳 – 三门峡 | 4 | emerald | normal | 70% | 88% | 95% |
| 郑州 – 洛阳 | 4 | obsidian | normal | 71% | 88% | 98% |
| 鹤壁 – 新乡 | 2 | amber | normal | 68% | 91% | 98% |
| 郑州 – 许昌 | 2 | crimson | normal | 79% | 92% | 99% |
| 驻马店 – 漯河 | 2 | violet | normal | 85% | 95% | 98% |
| 信阳 – 驻马店 | 2 | cobalt | normal | 84% | 94% | 100% |
| 郑州 – 开封 | 2 | amber | normal | 85% | 97% | 100% |
| 郑州 – 新乡 | 2 | emerald | ferry | 90% | 97% | 100% |

## Tickets

Of the times a ticket was held at the end of a game, how often it was completed. Hardest first.

| Ticket | Points | Kind | 2p done / held | 3p done / held | 4p done / held |
|---|---|---|---|---|---|
| 潢川 – 周口 | 10 | regular | 47% of 62 | 41% of 105 | 46% of 127 |
| 安阳 – 信阳 | 14 | long | 77% of 82 | 46% of 121 | 35% of 159 |
| 漯河 – 濮阳 | 11 | regular | 61% of 94 | 48% of 111 | 46% of 149 |
| 开封 – 信阳 | 10 | regular | 66% of 71 | 45% of 100 | 48% of 162 |
| 焦作 – 周口 | 8 | regular | 61% of 67 | 53% of 101 | 48% of 139 |
| 新乡 – 南阳 | 9 | regular | 71% of 65 | 44% of 95 | 55% of 130 |
| 少林寺 – 信阳 | 11 | regular | 73% of 89 | 49% of 122 | 51% of 146 |
| 西峡 – 洛阳 | 5 | regular | 46% of 13 | 55% of 31 | 62% of 29 |
| 新乡 – 商丘 | 9 | regular | 68% of 69 | 51% of 124 | 55% of 134 |
| 老君山 – 南阳 | 6 | regular | 69% of 13 | 56% of 45 | 58% of 52 |
| 濮阳 – 许昌 | 9 | regular | 66% of 76 | 54% of 107 | 59% of 161 |
| 潢川 – 驻马店 | 6 | regular | 76% of 29 | 52% of 48 | 58% of 67 |
| 安阳 – 开封 | 8 | regular | 79% of 70 | 57% of 106 | 57% of 138 |
| 鹤壁 – 洛阳 | 8 | regular | 67% of 51 | 65% of 99 | 61% of 104 |
| 洛阳 – 商丘 | 11 | regular | 72% of 93 | 60% of 135 | 61% of 179 |
| 开封 – 周口 | 7 | regular | 53% of 38 | 64% of 67 | 68% of 114 |
| 鹤壁 – 焦作 | 6 | regular | 74% of 38 | 73% of 66 | 56% of 85 |
| 鸡公山 – 郑州 | 10 | regular | 84% of 64 | 64% of 94 | 59% of 145 |
| 兰考 – 新乡 | 6 | regular | 89% of 38 | 57% of 68 | 63% of 99 |
| 济源 – 许昌 | 7 | regular | 66% of 59 | 65% of 93 | 67% of 122 |
| 西峡 – 平顶山 | 7 | regular | 71% of 35 | 65% of 68 | 66% of 92 |
| 许昌 – 商丘 | 8 | regular | 85% of 52 | 66% of 101 | 61% of 109 |
| 开封 – 濮阳 | 6 | regular | 68% of 25 | 64% of 47 | 72% of 65 |
| 焦作 – 平顶山 | 7 | regular | 73% of 59 | 73% of 88 | 65% of 112 |
| 三门峡 – 平顶山 | 7 | regular | 78% of 49 | 71% of 96 | 66% of 128 |
| 驻马店 – 南阳 | 7 | regular | 78% of 32 | 76% of 49 | 66% of 83 |
| 周口 – 信阳 | 6 | regular | 90% of 52 | 72% of 81 | 64% of 91 |
| 红旗渠 – 新乡 | 4 | regular | 86% of 14 | 68% of 41 | 73% of 59 |
| 三门峡 – 济源 | 6 | regular | 79% of 28 | 71% of 58 | 73% of 88 |
| 郑州 – 商丘 | 7 | regular | 79% of 58 | 73% of 99 | 71% of 129 |
| 云台山 – 开封 | 6 | regular | 86% of 36 | 66% of 61 | 74% of 100 |
| 郑州 – 信阳 | 8 | regular | 84% of 68 | 76% of 106 | 69% of 146 |
| 濮阳 – 南阳 | 14 | long | 80% of 46 | 74% of 62 | 73% of 89 |
| 老君山 – 郑州 | 7 | regular | 85% of 33 | 76% of 70 | 73% of 80 |
| 云台山 – 安阳 | 6 | regular | 80% of 35 | 77% of 64 | 74% of 76 |
| 鸡公山 – 漯河 | 6 | regular | 89% of 27 | 77% of 57 | 71% of 75 |
| 郑州 – 南阳 | 7 | regular | 80% of 54 | 79% of 90 | 73% of 106 |
| 郑州 – 三门峡 | 8 | regular | 81% of 63 | 77% of 115 | 75% of 175 |
| 济源 – 郑州 | 5 | regular | 92% of 25 | 74% of 58 | 75% of 85 |
| 少林寺 – 开封 | 5 | regular | 85% of 26 | 63% of 46 | 85% of 66 |
| 安阳 – 三门峡 | 14 | long | 81% of 54 | 76% of 86 | 78% of 111 |
| 漯河 – 商丘 | 6 | regular | 91% of 35 | 82% of 76 | 70% of 81 |
| 商丘 – 南阳 | 12 | long | 89% of 44 | 81% of 67 | 74% of 85 |
| 三门峡 – 商丘 | 15 | long | 80% of 41 | 73% of 80 | 84% of 115 |
| 平顶山 – 信阳 | 7 | regular | 89% of 66 | 81% of 93 | 76% of 116 |
| 郑州 – 安阳 | 6 | regular | 85% of 39 | 85% of 67 | 77% of 109 |
| 红旗渠 – 郑州 | 6 | regular | 86% of 42 | 78% of 65 | 82% of 83 |
| 洛阳 – 开封 | 6 | regular | 93% of 42 | 74% of 68 | 84% of 100 |
| 洛阳 – 新乡 | 6 | regular | 87% of 39 | 82% of 65 | 82% of 113 |
| 三门峡 – 信阳 | 14 | long | 91% of 54 | 84% of 75 | 81% of 108 |
