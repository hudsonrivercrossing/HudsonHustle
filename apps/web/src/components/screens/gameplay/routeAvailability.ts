import type { GameState, MapConfig, RouteDef, TrainCard } from "@hudson-hustle/game-core";

/** Whether the viewer may take a card from the market or deck right now. */
export function canDrawCards(game: GameState, canAct: boolean): boolean {
  return (
    canAct &&
    game.phase === "main" &&
    (game.turn.stage === "idle" || game.turn.stage === "drawing") &&
    !game.turn.tookFaceUpLocomotive &&
    game.turn.drawsTaken < 2
  );
}

/** Why the selected route offers no claim buttons, in the order a player would want to hear it. */
export function getRouteUnavailableReason({
  game,
  config,
  routeId,
  canAct
}: {
  game: GameState;
  config: MapConfig;
  routeId: string;
  canAct: boolean;
}): string | null {
  const route = config.routes.find((candidate) => candidate.id === routeId);
  if (!route) {
    return null;
  }
  const nameOf = (playerId: string) => game.players.find((player) => player.id === playerId)?.name ?? "another player";

  const claim = game.routeClaims.find((entry) => entry.routeId === route.id);
  if (claim) {
    return `Already claimed by ${nameOf(claim.playerId)}.`;
  }

  if (route.twinGroup && game.players.length <= 3) {
    const twinIds = config.routes.filter((candidate) => candidate.twinGroup === route.twinGroup && candidate.id !== route.id).map((candidate) => candidate.id);
    const twinClaim = game.routeClaims.find((entry) => twinIds.includes(entry.routeId));
    if (twinClaim) {
      return `This parallel route is closed in a ${game.players.length}-player game because ${nameOf(twinClaim.playerId)} claimed its twin.`;
    }
  }

  if (!canAct) {
    return "Wait for your turn to claim a route.";
  }
  if (game.phase !== "main") {
    return "Choose your tickets before claiming a route.";
  }
  if (game.turn.stage !== "idle") {
    return "Finish drawing before claiming a route.";
  }
  const viewer = game.players[game.activePlayerIndex];
  if (viewer.trainsLeft < route.length) {
    return `This route needs ${route.length} trains and you have ${viewer.trainsLeft} left.`;
  }
  return `Not enough cards yet. ${describeHolding(viewer.hand, route)}`;
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

/** The price of a route in cards, in the words a player would use. */
export function describeRouteCost(route: RouteDef): string {
  const locomotives = route.locomotiveCost ?? 0;
  const colorName = route.color === "gray" ? "of any one color" : route.color;
  const base =
    locomotives > 0
      ? `Costs ${plural(route.length, "card")} ${colorName}, at least ${plural(locomotives, "locomotive")} among them.`
      : `Costs ${plural(route.length, "card")} ${colorName}. Locomotives count as any color.`;
  return route.type === "tunnel" ? `${base} A tunnel can cost up to 3 more.` : base;
}

function describeHolding(hand: TrainCard[], route: RouteDef): string {
  const locomotives = hand.filter((card) => card.color === "locomotive").length;
  if (route.color === "gray") {
    const counts = new Map<string, number>();
    for (const card of hand) {
      if (card.color !== "locomotive") {
        counts.set(card.color, (counts.get(card.color) ?? 0) + 1);
      }
    }
    const best = [...counts.entries()].sort((left, right) => right[1] - left[1])[0];
    return best
      ? `Your best set is ${best[1]} ${best[0]} plus ${plural(locomotives, "locomotive")}.`
      : `You hold ${plural(locomotives, "locomotive")} and no colored cards.`;
  }
  const matching = hand.filter((card) => card.color === route.color).length;
  return `You hold ${matching} ${route.color} and ${plural(locomotives, "locomotive")}.`;
}
