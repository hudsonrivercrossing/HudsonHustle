import type { Meta, StoryObj } from "@storybook/react-vite";
import type { TrainCard } from "@hudson-hustle/game-core";
import { InspectorDock } from "./InspectorDock";
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

const sampleMarketContent = (
  <SupplyDock
    market={sampleMarket}
    deckCount={38}
    cardPalette={cardPalette}
    disabled={false}
    onDrawFromMarket={() => undefined}
    onDrawFromDeck={() => undefined}
    onDrawTickets={() => undefined}
  />
);

const sampleBuildContent = (
  <div className="action-empty-prompt" data-testid="action-empty-state">
    <span className="action-empty-prompt__title">Select a route or station.</span>
    <span className="action-empty-prompt__copy">Build options appear here.</span>
  </div>
);

const meta = {
  title: "Gameplay/InspectorDock",
  component: InspectorDock,
  args: {
    summary: null,
    marketContent: sampleMarketContent,
    buildContent: sampleBuildContent,
    activeBuildKey: null,
    currentPlayerName: "Rosa",
    deckCount: 38,
    ticketDeckCount: 14,
    turnNumber: 7
  },
  parameters: {
    docs: {
      description: {
        component:
          "Right-rail panel housing the Market, Build, and Chat tabs. Automatically switches to the Build tab when `activeBuildKey` is set. Footer row surfaces turn metadata like current player name, deck counts, and turn number."
      }
    }
  },
  render: (args) => (
    <div style={{ maxWidth: 360, minHeight: 480 }}>
      <InspectorDock {...args} />
    </div>
  )
} satisfies Meta<typeof InspectorDock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MarketTab: Story = {};

export const BuildTab: Story = {
  args: {
    activeBuildKey: "route-abc",
    summary: "Select a color to claim the route."
  }
};

export const WithSummary: Story = {
  args: {
    summary: "Rosa drew a card from the market."
  }
};

export const WithChat: Story = {
  args: {
    chatMessages: [
      { id: "msg-1", playerName: "Rosa", message: "Nice move!" },
      { id: "msg-2", playerName: "Milo", message: "Thanks, just getting warmed up." }
    ],
    onSendChat: () => undefined
  }
};

export const LocalPlayNoChat: Story = {
  args: {
    chatMessages: [],
    onSendChat: undefined
  }
};
