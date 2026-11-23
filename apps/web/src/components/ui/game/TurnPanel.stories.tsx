import type { Meta, StoryObj } from "@storybook/react-vite";
import { TurnPanel } from "./TurnPanel";

const meta = {
  title: "System/Game/TurnPanel",
  component: TurnPanel,
  args: {
    playerName: "Ava",
    state: { kind: "idle" }
  },
  decorators: [
    (Story) => (
      <div className="app-shell--gameplay-hud" style={{ width: 260 }}>
        <div className="right-col">
          <Story />
        </div>
      </div>
    )
  ]
} satisfies Meta<typeof TurnPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {};
export const ChoosingTickets: Story = { args: { state: { kind: "tickets", minimumKeep: 2 } } };
export const Drawing: Story = { args: { state: { kind: "drawing" } } };
export const Finished: Story = {
  args: { state: { kind: "finished", summary: "Ava finished drawing cards.", nextPlayerName: "Beau", onPass: () => undefined } }
};
export const Waiting: Story = { args: { state: { kind: "waiting", activePlayerName: "Bot 1" } } };
