import type { Meta, StoryObj } from "@storybook/react-vite";
import { CardSlot } from "./CardSlot";

const meta = {
  title: "System/Game/CardSlot",
  component: CardSlot,
  parameters: {
    docs: {
      description: {
        component:
          "Stable train-card slot used by Hand and Market. The component preserves fixed dimensions while the feature layer supplies counts, spend deltas, and click behavior."
      }
    }
  }
} satisfies Meta<typeof CardSlot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HandSlot: Story = {
  args: {
    mode: "hand",
    face: "emerald",
    accentColor: "#5aa79a",
    count: 2
  },
  render: () => (
    <CardSlot mode="hand" face="emerald" accentColor="#5aa79a" count={2} />
  )
};

export const EmptyHandSlot: Story = {
  args: {
    mode: "hand",
    face: "crimson",
    accentColor: "#c96d7c",
    count: 0
  },
  render: () => (
    <CardSlot mode="hand" face="crimson" accentColor="#c96d7c" count={0} />
  )
};

export const SpendingPreview: Story = {
  args: {
    mode: "hand",
    face: "amber",
    accentColor: "#d9ad4f",
    count: 4,
    spendDelta: 2
  },
  render: () => (
    <CardSlot mode="hand" face="amber" accentColor="#d9ad4f" count={4} spendDelta={2} />
  )
};

export const MarketSlot: Story = {
  args: {
    mode: "market",
    face: "locomotive",
    accentColor: "#91a8bd"
  },
  render: () => (
    <CardSlot mode="market" face="locomotive" accentColor="#91a8bd" onClick={() => undefined} />
  )
};
