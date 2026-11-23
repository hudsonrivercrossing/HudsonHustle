# Balance simulation — 河南 · 大河中原 (henan)

Generated 2026-11-23 by `scripts/sim/balance-sim.mjs`. Every seat is the same deterministic bot.
Read this as how the map behaves under that one policy. It finds dead routes and unreachable tickets; it does not predict human play.

Map: 25 stations, 40 routes, 44 tickets, 30 trains per player.

## Games

| Players | Seeds | Finished | Stuck | Crashed | Mean score | Mean spread (first − last) | Mean actions | Stations built per player |
|---|---|---|---|---|---|---|---|---|
| 2 | 300 | 300 | 0 | 0 | 71.9 | 26.0 | 102 | 0.00 |
| 3 | 300 | 300 | 0 | 0 | 62.5 | 42.3 | 152 | 0.00 |
| 4 | 300 | 300 | 0 | 0 | 56.1 | 53.6 | 195 | 0.00 |

## Seat order

Share of outright wins by seat. An even table would give each seat the same share.

| Players | Seat 1 | Seat 2 | Seat 3 | Seat 4 | Ties |
|---|---|---|---|---|---|
| 2 | 53% | 46% |  |  | 1% |
| 3 | 38% | 31% | 28% |  | 2% |
| 4 | 30% | 21% | 25% | 23% | 1% |

## Routes

How often each route ends the game claimed. Sorted by the average across player counts, least used first.

| Route | Length | Color | Type | 2p | 3p | 4p |
|---|---|---|---|---|---|---|
| 洛阳 – 三门峡 | 4 | amber | tunnel | 0% | 1% | 64% |
| 郑州 – 许昌 | 2 | ivory | normal | 0% | 0% | 87% |
| 郑州 – 新乡 | 2 | violet | ferry | 0% | 0% | 96% |
| 郑州 – 开封 | 2 | cobalt | normal | 0% | 0% | 97% |
| 南阳 – 信阳 | 5 | obsidian | tunnel | 20% | 33% | 56% |
| 郑州 – 周口 | 5 | emerald | normal | 15% | 40% | 70% |
| 少林寺 – 洛阳 | 2 | gray | tunnel | 9% | 42% | 79% |
| 三门峡 – 老君山 | 3 | gray | tunnel | 15% | 43% | 74% |
| 信阳 – 鸡公山 | 2 | gray | tunnel | 29% | 44% | 69% |
| 老君山 – 西峡 | 2 | gray | tunnel | 14% | 53% | 83% |
| 安阳 – 红旗渠 | 3 | gray | tunnel | 26% | 57% | 88% |
| 洛阳 – 济源 | 2 | cobalt | ferry | 26% | 64% | 89% |
| 新乡 – 濮阳 | 5 | emerald | normal | 38% | 64% | 78% |
| 洛阳 – 老君山 | 3 | gray | tunnel | 24% | 77% | 94% |
| 焦作 – 济源 | 2 | crimson | normal | 29% | 75% | 96% |
| 云台山 – 焦作 | 2 | ivory | normal | 37% | 75% | 89% |
| 兰考 – 濮阳 | 4 | crimson | ferry | 51% | 76% | 83% |
| 濮阳 – 安阳 | 3 | ivory | normal | 47% | 72% | 93% |
| 新乡 – 云台山 | 2 | obsidian | normal | 43% | 79% | 94% |
| 郑州 – 焦作 | 3 | rose | ferry | 47% | 82% | 93% |
| 周口 – 商丘 | 4 | ivory | normal | 59% | 83% | 89% |
| 西峡 – 南阳 | 4 | rose | normal | 63% | 78% | 90% |
| 漯河 – 周口 | 2 | crimson | normal | 56% | 88% | 97% |
| 商丘 – 兰考 | 3 | rose | normal | 64% | 88% | 98% |
| 洛阳 – 三门峡 | 4 | emerald | normal | 69% | 90% | 95% |
| 郑州 – 少林寺 | 3 | gray | normal | 65% | 91% | 100% |
| 郑州 – 洛阳 | 4 | obsidian | normal | 70% | 89% | 98% |
| 兰考 – 开封 | 2 | obsidian | normal | 68% | 90% | 100% |
| 洛阳 – 平顶山 | 3 | crimson | normal | 76% | 90% | 98% |
| 安阳 – 鹤壁 | 2 | cobalt | normal | 74% | 91% | 100% |
| 鹤壁 – 新乡 | 2 | amber | normal | 72% | 94% | 100% |
| 漯河 – 许昌 | 2 | obsidian | normal | 76% | 94% | 100% |
| 郑州 – 平顶山 | 4 | violet | normal | 78% | 94% | 97% |
| 平顶山 – 南阳 | 3 | ivory | normal | 78% | 94% | 99% |
| 信阳 – 驻马店 | 2 | cobalt | normal | 81% | 93% | 99% |
| 漯河 – 平顶山 | 3 | amber | normal | 81% | 95% | 98% |
| 郑州 – 许昌 | 2 | crimson | normal | 85% | 94% | 99% |
| 驻马店 – 漯河 | 2 | violet | normal | 83% | 96% | 99% |
| 郑州 – 新乡 | 2 | emerald | ferry | 89% | 98% | 100% |
| 郑州 – 开封 | 2 | amber | normal | 90% | 98% | 100% |

## Tickets

Of the times a ticket was held at the end of a game, how often it was completed. Hardest first.

| Ticket | Points | Kind | 2p done / held | 3p done / held | 4p done / held |
|---|---|---|---|---|---|
| 安阳 – 信阳 | 14 | long | 68% of 84 | 44% of 123 | 30% of 166 |
| 漯河 – 濮阳 | 11 | regular | 59% of 96 | 50% of 143 | 40% of 167 |
| 开封 – 信阳 | 10 | regular | 65% of 81 | 41% of 99 | 43% of 159 |
| 驻马店 – 开封 | 8 | regular | 65% of 49 | 36% of 74 | 50% of 103 |
| 焦作 – 周口 | 8 | regular | 46% of 65 | 52% of 97 | 55% of 112 |
| 濮阳 – 许昌 | 9 | regular | 56% of 71 | 55% of 106 | 50% of 186 |
| 西峡 – 洛阳 | 5 | regular | 50% of 16 | 59% of 41 | 47% of 38 |
| 安阳 – 开封 | 8 | regular | 70% of 66 | 45% of 95 | 50% of 136 |
| 鸡公山 – 郑州 | 10 | regular | 67% of 83 | 53% of 137 | 48% of 146 |
| 新乡 – 商丘 | 9 | regular | 66% of 73 | 55% of 124 | 52% of 148 |
| 驻马店 – 南阳 | 7 | regular | 75% of 40 | 54% of 80 | 55% of 73 |
| 新乡 – 南阳 | 9 | regular | 70% of 71 | 63% of 107 | 50% of 131 |
| 少林寺 – 信阳 | 11 | regular | 80% of 102 | 58% of 157 | 52% of 172 |
| 焦作 – 平顶山 | 7 | regular | 63% of 43 | 62% of 99 | 60% of 110 |
| 济源 – 许昌 | 7 | regular | 50% of 42 | 64% of 66 | 65% of 107 |
| 洛阳 – 商丘 | 11 | regular | 64% of 103 | 68% of 165 | 56% of 189 |
| 许昌 – 商丘 | 8 | regular | 77% of 57 | 58% of 92 | 61% of 122 |
| 老君山 – 南阳 | 6 | regular | 67% of 15 | 63% of 48 | 63% of 46 |
| 鹤壁 – 洛阳 | 8 | regular | 79% of 70 | 66% of 117 | 55% of 129 |
| 老君山 – 郑州 | 7 | regular | 75% of 24 | 63% of 82 | 63% of 95 |
| 开封 – 周口 | 7 | regular | 71% of 51 | 67% of 78 | 63% of 118 |
| 郑州 – 信阳 | 8 | regular | 76% of 67 | 71% of 117 | 60% of 142 |
| 商丘 – 南阳 | 12 | long | 69% of 39 | 77% of 56 | 60% of 80 |
| 云台山 – 开封 | 6 | regular | 75% of 32 | 60% of 57 | 72% of 95 |
| 周口 – 洛阳 | 8 | regular | 71% of 78 | 70% of 138 | 67% of 171 |
| 鹤壁 – 焦作 | 6 | regular | 71% of 35 | 74% of 66 | 63% of 67 |
| 西峡 – 平顶山 | 7 | regular | 81% of 52 | 68% of 76 | 63% of 78 |
| 濮阳 – 南阳 | 14 | long | 82% of 51 | 75% of 72 | 60% of 91 |
| 红旗渠 – 郑州 | 9 | regular | 89% of 61 | 68% of 111 | 65% of 158 |
| 红旗渠 – 新乡 | 7 | regular | 81% of 43 | 75% of 76 | 64% of 83 |
| 兰考 – 新乡 | 6 | regular | 81% of 53 | 67% of 84 | 72% of 113 |
| 鸡公山 – 漯河 | 6 | regular | 96% of 28 | 72% of 60 | 63% of 63 |
| 安阳 – 三门峡 | 14 | long | 86% of 50 | 81% of 80 | 64% of 108 |
| 平顶山 – 信阳 | 7 | regular | 85% of 54 | 67% of 85 | 79% of 104 |
| 郑州 – 三门峡 | 8 | regular | 78% of 68 | 77% of 135 | 75% of 168 |
| 三门峡 – 信阳 | 14 | long | 93% of 54 | 77% of 82 | 69% of 110 |
| 三门峡 – 商丘 | 15 | long | 91% of 57 | 71% of 97 | 75% of 124 |
| 三门峡 – 平顶山 | 7 | regular | 91% of 46 | 80% of 88 | 70% of 98 |
| 三门峡 – 济源 | 6 | regular | 82% of 38 | 78% of 69 | 77% of 98 |
| 济源 – 郑州 | 5 | regular | 77% of 26 | 72% of 60 | 86% of 70 |
| 郑州 – 商丘 | 7 | regular | 91% of 57 | 72% of 116 | 82% of 130 |
| 郑州 – 南阳 | 7 | regular | 82% of 57 | 78% of 89 | 81% of 99 |
| 云台山 – 安阳 | 6 | regular | 81% of 27 | 90% of 49 | 74% of 69 |
| 少林寺 – 开封 | 5 | regular | 81% of 32 | 72% of 50 | 89% of 71 |
