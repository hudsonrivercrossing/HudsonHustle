import { summarizeEndgame, type GameState, type MapConfig } from "@hudson-hustle/game-core";

interface EndgameBreakdownProps {
  player: GameState["players"][number];
  config: MapConfig;
}

interface EndgameBreakdownEntry {
  key: string;
  label: string;
  value: string;
  items: string[];
  list: boolean;
}

function buildEndgameEntry(line: string): EndgameBreakdownEntry {
  const [rawLabel, ...valueParts] = line.split(":");
  const label = rawLabel.trim();
  const value = valueParts.join(":").trim();
  const list = label === "Completed tickets" || label === "Failed tickets";

  return {
    key: line,
    label,
    value,
    items: list && value !== "none" ? value.split(", ").filter(Boolean) : [],
    list
  };
}

export function EndgameBreakdown({ player, config }: EndgameBreakdownProps): JSX.Element {
  const entries = summarizeEndgame(player, config).map(buildEndgameEntry);

  return (
    <div className="endgame-breakdown">
      {entries.map((entry) => (
        <div key={entry.key} className="endgame-breakdown__row">
          <span className="endgame-breakdown__label">{entry.label}</span>
          {entry.list && entry.items.length > 0 ? (
            <ul className="endgame-breakdown__list">
              {entry.items.map((item) => (
                <li key={item} className="endgame-breakdown__list-item">
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <span className={`endgame-breakdown__value ${entry.list ? "endgame-breakdown__value--empty" : ""}`}>
              {entry.value || entry.key}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
