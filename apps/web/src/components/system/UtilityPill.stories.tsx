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
          "Deprecated shell chrome metadata and session artifact. Prefer `Badge` for compact inline state and feature-owned chrome for session metadata."
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
