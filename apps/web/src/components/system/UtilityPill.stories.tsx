import type { Meta, StoryObj } from "@storybook/react-vite";
import { UtilityPill } from "./UtilityPill";

const meta = {
  title: "System/UtilityPill",
  component: UtilityPill,
  args: {
    value: "v2.1 · shell-system",
    label: "Config",
    tone: "accent"
  },
  parameters: {
    docs: {
      description: {
        component:
          "Shell chrome metadata and session artifact. Use this for config/session/topbar information. Do not use it as an inline gameplay state tag; that belongs to `Chip`."
      }
    }
  },
  render: (args) => <UtilityPill {...args} />
} satisfies Meta<typeof UtilityPill>;

export default meta;
type Story = StoryObj<typeof meta>;

export const StackedAccent: Story = {};

export const StackedNeutral: Story = {
  args: {
    value: "M7QK",
    label: "Room",
    tone: "neutral"
  }
};

export const Interactive: Story = {
  args: {
    value: "Reconnect token",
    label: "Session",
    tone: "neutral",
    interactive: true
  }
};

export const Single: Story = {
  args: {
    value: "Preview · develop",
    label: undefined,
    tone: "neutral"
  }
};
