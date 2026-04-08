# V2 Docs

This folder groups the multiplayer-specific product and engineering docs for `v2`.

## Files
- [V2 MVP Architecture](/Users/djfan/Workspace/HudsonHustle/docs/product/v2/v2-mvp-architecture.md)
- [V2 Multiplayer Flow](/Users/djfan/Workspace/HudsonHustle/docs/product/v2/v2-multiplayer-flow.md)
- [V2 Deployment](/Users/djfan/Workspace/HudsonHustle/docs/product/v2/v2-deployment.md)
- [V2.1 Design Lock](/Users/djfan/Workspace/HudsonHustle/docs/product/v2/v2.1-design-lock.md)
- [V2.1 Design Critique And Reference](/Users/djfan/Workspace/HudsonHustle/docs/product/v2/v2.1-design-critique-and-reference.md)
- [V2.1 Shell Design Direction](/Users/djfan/Workspace/HudsonHustle/docs/product/v2/v2.1-shell-design-direction.md)
- [V2.1 Shell Review Memo](/Users/djfan/Workspace/HudsonHustle/docs/product/v2/v2.1-shell-review-memo.md)
- [V2.2 System Player PRD](/Users/djfan/Workspace/HudsonHustle/docs/product/v2/v2.2-system-player-prd.md)
- [V2.2 System Player Plan](/Users/djfan/Workspace/HudsonHustle/docs/product/v2/v2.2-system-player-plan.md)
- [V2.2 Slice 1 Bot Seat Implementation PRD](/Users/djfan/Workspace/HudsonHustle/docs/product/v2/v2.2-slice-1-bot-seat-implementation-prd.md)
- [V2.2 Slice 1 Bot Seat Issues](/Users/djfan/Workspace/HudsonHustle/docs/product/v2/v2.2-slice-1-bot-seat-issues.md)
- [V2.2 Slice 2 Public Bot Setup Implementation PRD](/Users/djfan/Workspace/HudsonHustle/docs/product/v2/v2.2-slice-2-public-bot-setup-implementation-prd.md)
- [V2.2 Slice 2 Public Bot Setup Issues](/Users/djfan/Workspace/HudsonHustle/docs/product/v2/v2.2-slice-2-public-bot-setup-issues.md)
- [V2.2 Slice 3 Bot Quality Implementation PRD](/Users/djfan/Workspace/HudsonHustle/docs/product/v2/v2.2-slice-3-bot-quality-implementation-prd.md)
- [V2.2 Slice 3 Bot Quality Issues](/Users/djfan/Workspace/HudsonHustle/docs/product/v2/v2.2-slice-3-bot-quality-issues.md)
- [V2.2 System Agent Architecture](/Users/djfan/Workspace/HudsonHustle/docs/product/v2/v2.2-system-agent-architecture.md)

## How To Use These
- Start with [V2 MVP Architecture](/Users/djfan/Workspace/HudsonHustle/docs/product/v2/v2-mvp-architecture.md) for scope and system boundaries.
- Use [V2 Multiplayer Flow](/Users/djfan/Workspace/HudsonHustle/docs/product/v2/v2-multiplayer-flow.md) for room UX, reconnect, and player-facing session flow.
- Use [V2 Deployment](/Users/djfan/Workspace/HudsonHustle/docs/product/v2/v2-deployment.md) for `Vercel` / `Railway` setup and branch-to-environment behavior.
- Use [Design System](/Users/djfan/Workspace/HudsonHustle/docs/product/design-system.md) for stable top-level design-system truth.
- Use [Design Showcases](/Users/djfan/Workspace/HudsonHustle/docs/product/showcase/README.md) when you want the lightweight HTML review artifacts for fonts and system components.
- Use [V2.1 Design Lock](/Users/djfan/Workspace/HudsonHustle/docs/product/v2/v2.1-design-lock.md) for the minimum system decisions that should stay fixed while the first `v2.1` design slice is implemented.
- Use [V2.1 Design Critique And Reference](/Users/djfan/Workspace/HudsonHustle/docs/product/v2/v2.1-design-critique-and-reference.md) and [V2.1 Shell Design Direction](/Users/djfan/Workspace/HudsonHustle/docs/product/v2/v2.1-shell-design-direction.md) for the current shell-first design-system work.
- Use [V2.1 Shell Review Memo](/Users/djfan/Workspace/HudsonHustle/docs/product/v2/v2.1-shell-review-memo.md) for the latest multi-agent review findings and the concrete `v2.1` shell corrections they led to.
- Use [V2.2 System Player PRD](/Users/djfan/Workspace/HudsonHustle/docs/product/v2/v2.2-system-player-prd.md) for the first bounded `v2.2` product requirement around a built-in system-owned player seat.
- Use [V2.2 System Player Plan](/Users/djfan/Workspace/HudsonHustle/docs/product/v2/v2.2-system-player-plan.md) for the phased implementation order and validation path for that first `v2.2` milestone.
- Use [V2.2 Slice 1 Bot Seat Implementation PRD](/Users/djfan/Workspace/HudsonHustle/docs/product/v2/v2.2-slice-1-bot-seat-implementation-prd.md) when starting the first architecture-proof implementation slice.
- Use [V2.2 Slice 1 Bot Seat Issues](/Users/djfan/Workspace/HudsonHustle/docs/product/v2/v2.2-slice-1-bot-seat-issues.md) for task-sized breakdown of that first slice.
- Use [V2.2 Slice 2 Public Bot Setup Implementation PRD](/Users/djfan/Workspace/HudsonHustle/docs/product/v2/v2.2-slice-2-public-bot-setup-implementation-prd.md) when turning the internal bot-seat proof into normal multiplayer setup work.
- Use [V2.2 Slice 2 Public Bot Setup Issues](/Users/djfan/Workspace/HudsonHustle/docs/product/v2/v2.2-slice-2-public-bot-setup-issues.md) for task-sized breakdown of the first public bot-setup slice.
- Use [V2.2 Slice 3 Bot Quality Implementation PRD](/Users/djfan/Workspace/HudsonHustle/docs/product/v2/v2.2-slice-3-bot-quality-implementation-prd.md) when improving the bot from legal baseline to competent baseline quality.
- Use [V2.2 Slice 3 Bot Quality Issues](/Users/djfan/Workspace/HudsonHustle/docs/product/v2/v2.2-slice-3-bot-quality-issues.md) for task-sized breakdown of the first bot-quality slice.
- Use [V2.2 System Agent Architecture](/Users/djfan/Workspace/HudsonHustle/docs/product/v2/v2.2-system-agent-architecture.md) for the first system-player recommendation path.

## Current V2.2 Slice 1 Status
- authoritative room model now supports server-owned `bot` seats
- the first server-owned legal action loop is proven
- the current deterministic baseline bot can:
  - confirm starting tickets
  - make simple ticket-aligned route claims
  - make deterministic draw choices when no obvious claim is available
- the remaining `v2.2` work should build from this internal proof instead of reopening controller foundations

## Current V2.2 Slice 2 Focus
- expose `bot` seat selection in normal multiplayer room setup
- support mixed human/bot rooms up to room size
- prove normal setup, lobby, and start flow for the first public bot-seat milestone

## Current V2.2 Slice 3 Focus
- improve the baseline bot from “legal” to “competent deterministic”
- strengthen ticket-keep, claim, and draw heuristics
- keep the policy testable and free of difficulty-tier creep
