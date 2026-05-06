import { type GameState, type MapConfig } from "@hudson-hustle/game-core";
import { EndgameBreakdown } from "../EndgameBreakdown";
import { SurfaceCard } from "../system/SurfaceCard";

interface EndgameGridProps {
  players: GameState["players"];
  config: MapConfig;
}

export function EndgameGrid({ players, config }: EndgameGridProps): JSX.Element {
  const winnerScore = Math.max(...players.map((p) => p.score));

  return (
    <div className="endgame-grid">
      {players.map((player) => {
        const isWinner = player.score === winnerScore;
        return (
          <SurfaceCard
            key={player.id}
            as="article"
            variant="summary"
            eyebrow={isWinner ? "Winner" : "Final score"}
            title={player.name}
            className={`endgame-card ${isWinner ? "endgame-card--winner" : ""}`}
          >
            <div className="endgame-card__hero">
              <p className="endgame-score">{player.score}</p>
              <span className="endgame-score__label">points</span>
            </div>
            <EndgameBreakdown player={player} config={config} />
          </SurfaceCard>
        );
      })}
    </div>
  );
}
