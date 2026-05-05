import type { Meta, StoryObj } from "@storybook/react-vite";
import type { TrainCard } from "@hudson-hustle/game-core";
import { SupplyDock } from "./SupplyDock";

const cardPalette: Record<string, string> = {
  crimson: "#c0392b",
  cobalt: "#2980b9",
  emerald: "#27ae60",
  amber: "#f39c12",
  violet: "#9b59b6",
  rose: "#e91e8c",
  ivory: "#ecf0f1",
  obsidian: "#2c3e50",
  locomotive: "#91a8bd"
};

const sampleMarket: TrainCard[] = [
  { id: "card-1", color: "crimson" },
  { id: "card-2", color: "cobalt" },
  { id: "card-3", color: "locomotive" },
  { id: "card-4", color: "emerald" },
  { id: "card-5", color: "amber" }
];

const meta = {
  title: "Gameplay/SupplyDock",
  component: SupplyDock,
  args: {
    market: sampleMarket,
    deckCount: 42,
    cardPalette,
    disabled: false,
    drawTicketsDisabled: false,
    onDrawFromMarket: () => undefined,
    onDrawFromDeck: () => undefined,
    onDrawTickets: () => undefined
  },
  parameters: {
    docs: {
      description: {
        component:
          "Card market and draw controls for the active player. Shows five face-up market slots, a deck draw button, and an optional ticket draw button. All slots are disabled between draw steps or when it is not the viewer's turn."
      }
    }
  },
  render: (args) => (
    <div style={{ maxWidth: 320 }}>
      <SupplyDock {...args} />
    </div>
  )
} satisfies Meta<typeof SupplyDock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {};

export const Disabled: Story = {
  args: {
    disabled: true
  }
};

export const TicketsDisabled: Story = {
  args: {
    drawTicketsDisabled: true
  }
};

export const NoTicketDraw: Story = {
  args: {
    onDrawTickets: undefined
  }
};

export const LowDeck: Story = {
  args: {
    deckCount: 3
  }
};
