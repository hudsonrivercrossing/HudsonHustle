import { useId } from "react";
import { Button } from "./system/Button";

interface ScoreGuideProps {
  className?: string;
}

const routePointRows = [
  "1 train = 1 point",
  "2 trains = 2 points",
  "3 trains = 4 points",
  "4 trains = 7 points",
  "5 trains = 10 points",
  "6 trains = 15 points"
];

export function ScoreGuide({ className }: ScoreGuideProps): JSX.Element {
  const panelId = useId();
  const classes = ["score-guide", className].filter(Boolean).join(" ");

  return (
    <div className={classes}>
      <Button className="score-guide__trigger" aria-describedby={panelId}>
        Scoring
      </Button>
      <div id={panelId} className="score-guide__panel" role="note">
        <p className="score-guide__eyebrow">Final scoring</p>
        <div className="score-guide__section">
          <strong className="score-guide__heading">Route points</strong>
          <ul className="score-guide__list">
            {routePointRows.map((row) => (
              <li key={row}>{row}</li>
            ))}
          </ul>
        </div>
        <div className="score-guide__section">
          <strong className="score-guide__heading">Endgame</strong>
          <ul className="score-guide__list">
            <li>Completed tickets: add printed points.</li>
            <li>Incomplete tickets: subtract printed points.</li>
            <li>Unused stations: +4 each.</li>
            <li>Longest continuous network: +10. Ties each get the bonus.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
