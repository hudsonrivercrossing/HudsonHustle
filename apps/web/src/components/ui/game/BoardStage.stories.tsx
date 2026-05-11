import type { Meta, StoryObj } from "@storybook/react-vite";
import { BoardStage } from "./BoardStage";

const meta = {
  title: "Gameplay/BoardStage",
  component: BoardStage,
  args: {
    isMyTurn: false,
    children: (
      <div
        style={{
          width: "100%",
          height: 320,
          background: "var(--color-surface-subtle, #e8eef2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 4,
          color: "var(--color-text-muted, #6b7a86)",
          fontSize: 14
        }}
      >
        Board map renders here
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        component:
          "Outer wrapper panel for the game board. Applies the `board-stage` shell and a `board-stage--my-turn` modifier when it is the viewer's active turn."
      }
    }
  },
  render: (args) => <BoardStage {...args} />
} satisfies Meta<typeof BoardStage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {};

export const MyTurn: Story = {
  args: {
    isMyTurn: true
  }
};
