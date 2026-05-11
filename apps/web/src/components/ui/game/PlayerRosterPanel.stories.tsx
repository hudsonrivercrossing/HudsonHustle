import type { Meta, StoryObj } from "@storybook/react-vite";
import { FloatingPlayerRoster, PlayerRoster } from "./PlayerRosterPanel";

const playerPalette: Record<string, string> = {
  red: "#c0392b",
  blue: "#2980b9",
  green: "#27ae60",
  yellow: "#f39c12"
};

const samplePlayers = [
  { id: "player-1", name: "Rosa", color: "red", trainsLeft: 24, stationsLeft: 3, ticketCount: 3, avatarName: "Conductor" },
  { id: "player-2", name: "Milo", color: "blue", trainsLeft: 19, stationsLeft: 2, ticketCount: 2, avatarName: "Engineer" },
  { id: "player-3", name: "Jack", color: "green", trainsLeft: 32, stationsLeft: 3, ticketCount: 4, avatarName: "Dispatcher" },
  { id: "player-4", name: "Lily", color: "yellow", trainsLeft: 11, stationsLeft: 1, ticketCount: 1, avatarName: "Caboose" }
];

const rosterMeta = {
  title: "Gameplay/PlayerRoster",
  component: PlayerRoster,
  args: {
    players: samplePlayers,
    activePlayerIndex: 0,
    playerPalette,
    timer: null
  },
  parameters: {
    docs: {
      description: {
        component:
          "Scoreboard rail showing all player seats with train counts, ticket counts, and the active-player label. Renders up to four fixed-width SeatTile slots, filling empty seats with placeholder tiles."
      }
    }
  },
  render: (args) => (
    <div style={{ maxWidth: 480 }}>
      <PlayerRoster {...args} />
    </div>
  )
} satisfies Meta<typeof PlayerRoster>;

export default rosterMeta;
type Story = StoryObj<typeof rosterMeta>;

export const FourPlayers: Story = {};

export const ActivePlayerTwo: Story = {
  args: {
    activePlayerIndex: 1
  }
};

export const WithTimer: Story = {
  args: {
    activePlayerIndex: 0,
    timer: { activePlayerIndex: 0, secondsRemaining: 28 }
  }
};

export const TwoPlayers: Story = {
  args: {
    players: samplePlayers.slice(0, 2),
    activePlayerIndex: 1
  }
};

export const FloatingRoster: Story = {
  render: () => (
    <div style={{ position: "relative", width: 560, height: 360, background: "var(--color-surface-subtle, #e8eef2)", borderRadius: 8 }}>
      <FloatingPlayerRoster
        players={samplePlayers.slice(0, 3)}
        activePlayerIndex={0}
        playerPalette={playerPalette}
        viewerPlayerId="player-1"
      />
    </div>
  )
};
