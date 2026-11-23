import { useState } from "react";
import { Button } from "../ui/primitives/Button";

interface GuideStep {
  eyebrow: string;
  title: string;
  rule: string;
  points: string[];
  note: string;
}

const guideSteps: GuideStep[] = [
  {
    eyebrow: "Goal",
    title: "Win the table",
    rule: "Highest score wins.",
    points: [
      "Claim routes for points right away.",
      "Complete destination tickets for endgame points.",
      "Unused stations and the longest network can swing the final score."
    ],
    note: "Unfinished tickets subtract their printed points, so every secret plan carries risk."
  },
  {
    eyebrow: "Turn",
    title: "Take one action",
    rule: "On your turn, choose exactly one major move.",
    points: [
      "Draw two transit cards. A face-up locomotive counts as both.",
      "Claim one route.",
      "Draw new destination tickets.",
      "Build one station."
    ],
    note: "Once the move is made, play passes to the next seat."
  },
  {
    eyebrow: "Tickets",
    title: "Follow your secret plan",
    rule: "Tickets tell you which places your network must connect.",
    points: [
      "At setup, keep at least 2 of your 4 starting tickets.",
      "Later ticket draws make you keep at least 1 and spend the turn.",
      "A ticket is stamped Done once your network connects its two stations."
    ],
    note: "Do not take more tickets unless you have time and routes left to finish them."
  },
  {
    eyebrow: "Routes",
    title: "Turn cards into routes",
    rule: "Spend cards that match the route color and length.",
    points: [
      "A length 4 route needs 4 matching cards and 4 trains left.",
      "Gray routes still need one single color set.",
      "Longer routes spend more trains and score more points."
    ],
    note: "Locomotives count as any color. A ferry needs a set number of them."
  },
  {
    eyebrow: "Open routes",
    title: "Claimed routes close",
    rule: "A claimed route is gone for the rest of the game.",
    points: [
      "Open parallel routes can still be claimed when the player count allows.",
      "In 2-3 player games, claiming one side of a double route locks the twin side too.",
      "Claim crossings before the table closes around your tickets."
    ],
    note: "This is why the same ticket can be easy early and expensive late."
  },
  {
    eyebrow: "Special routes",
    title: "Check tunnels and ferries",
    rule: "Some routes change the payment before you can claim them.",
    points: [
      "A tunnel turns over three cards when you try to claim it. Each one in your color, and each locomotive, costs one more card.",
      "If you cannot pay the extra, the claim fails, you keep your cards and the turn is spent.",
      "A ferry needs locomotives as part of the payment; the route says how many."
    ],
    note: "Do not enter a tunnel with the exact minimum unless you accept the gamble."
  },
  {
    eyebrow: "Stations",
    title: "Rescue one connection",
    rule: "A station helps your tickets. It does not help you claim routes.",
    points: [
      "Each station can borrow exactly 1 adjacent rival route for ticket scoring.",
      "A station does not borrow a rival's whole network.",
      "The first station costs 1 card, the second 2, the third 3, all one color. Each station you never build scores 4 points."
    ],
    note: "Use a station when it saves a big ticket or bypasses a closed crossing."
  },
  {
    eyebrow: "Final round",
    title: "Watch the table close",
    rule: "The final round starts when pressure reaches the board.",
    points: [
      "If a player ends a turn with 2 or fewer trains, final round begins.",
      "If no route remains open on the board, final round also begins.",
      "Every other player gets one last turn before final scoring."
    ],
    note: "Late tickets are dangerous when trains are low or the map is nearly full."
  },
  {
    eyebrow: "Table modes",
    title: "Bots play the same rules",
    rule: "Bot seats follow the same rules and score the same way as people.",
    points: [
      "Bots take their turns by themselves, in a local game and online.",
      "In a local game the screen is passed only between the people at the table.",
      "Online, a player who drops out can come back to the same seat from the same browser."
    ],
    note: "Use bot seats to fill the table without changing the game rules."
  }
];

interface GuidebookScreenProps {
  onBack: () => void;
  onReplayTour?: () => void;
}

export function GuidebookScreen({ onBack, onReplayTour }: GuidebookScreenProps): JSX.Element {
  const [stepIndex, setStepIndex] = useState(0);
  const step = guideSteps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === guideSteps.length - 1;

  return (
    <main
      className="guidebook-shell"
      style={{
        ["--setup-gateway-image" as string]: `url("/setup/landing-bg.webp")`
      }}
      data-testid="guidebook-screen"
    >
      <div className="guidebook-page-action">
        <Button onClick={onBack}>Back</Button>
        {onReplayTour ? (
          <Button onClick={onReplayTour}>Show tips again</Button>
        ) : null}
      </div>
      <section className="guidebook-card" aria-labelledby="guidebook-step-title">
        <div className="guidebook-rule-card">
          <div className="guidebook-progress-row">
            <span>Hudson Hustle guide · {step.eyebrow}</span>
            <strong>
              {stepIndex + 1} / {guideSteps.length}
            </strong>
          </div>

          <article className="guidebook-copy" aria-live="polite">
            <h1 id="guidebook-step-title">{step.title}</h1>
            <p className="guidebook-rule">{step.rule}</p>
            <ul>
              {step.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <p className="guidebook-note">{step.note}</p>
          </article>
        </div>

        <footer className="guidebook-nav" aria-label="Guide navigation">
          <Button disabled={isFirst} onClick={() => setStepIndex((current) => Math.max(0, current - 1))} aria-label="Previous guide step">
            <span aria-hidden="true">←</span>
          </Button>
          <div className="guidebook-track" aria-hidden="true">
            {guideSteps.map((entry, index) => (
              <span key={entry.title} className={index === stepIndex ? "guidebook-track__dot guidebook-track__dot--active" : "guidebook-track__dot"} />
            ))}
          </div>
          {isLast ? (
            <Button variant="primary" onClick={onBack}>
              Finish
            </Button>
          ) : (
            <Button variant="primary" onClick={() => setStepIndex((current) => Math.min(guideSteps.length - 1, current + 1))} aria-label="Next guide step">
              <span aria-hidden="true">→</span>
            </Button>
          )}
        </footer>
      </section>
    </main>
  );
}
