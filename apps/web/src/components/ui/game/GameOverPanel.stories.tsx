import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../../ui/primitives/Button";
import { SurfaceCard } from "../../ui/primitives/SurfaceCard";
import { GameOverPanel } from "./GameOverPanel";

const meta = {
  title: "System/Game/GameOverPanel",
  component: GameOverPanel,
  args: {
    title: "Final board locked.",
    subtitle: "Review completed routes, station saves, and ticket swings before leaving the table.",
    actions: (
      <>
        <Button disabled>Share result</Button>
        <Button variant="primary">Play again</Button>
      </>
    ),
    children: (
      <div className="endgame-grid">
        <SurfaceCard as="article" variant="summary" title="Host" className="endgame-card">
          <div className="endgame-card__hero">
            <p className="endgame-score">84</p>
            <span className="endgame-score__label">points</span>
          </div>
        </SurfaceCard>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        component:
          "Final-score shell for gameplay. Scoring cards are passed as children so scoring details stay feature-owned."
      }
    }
  },
  render: (args) => <GameOverPanel {...args} />
} satisfies Meta<typeof GameOverPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FinalScore: Story = {};
