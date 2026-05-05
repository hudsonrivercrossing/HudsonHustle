import type { Meta, StoryObj } from "@storybook/react-vite";
import { SeatTile } from "./SeatTile";

const meta = {
  title: "System/Game/SeatTile",
  component: SeatTile,
  args: {
    name: "Host",
    color: "#4f9aa5",
    ticketCount: 2,
    trainsLeft: 24,
    stationsLeft: 3,
    active: true,
    timerLabel: "09"
  },
  parameters: {
    docs: {
      description: {
        component:
          "Compact player/seat tile for the board top row. The tile reserves active, timer, and placeholder states without resizing the roster."
      }
    }
  },
  render: (args) => <SeatTile {...args} />
} satisfies Meta<typeof SeatTile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {};

export const Waiting: Story = {
  args: {
    name: "Bot 1",
    color: "#c96342",
    active: false,
    timerLabel: null
  }
};

export const Placeholder: Story = {
  args: {
    placeholder: true,
    seatLabel: "Seat 4"
  }
};
