import type { Meta, StoryObj } from "@storybook/react-vite";
import { StatusBanner } from "./StatusBanner";

const meta = {
  title: "System/Primitives/StatusBanner",
  component: StatusBanner,
  args: {
    tone: "neutral",
    eyebrow: "Shared state",
    headline: "Table is ready to start.",
    copy: "Use this for high-signal shell status that should stay visible and immediately scannable."
  },
  parameters: {
    docs: {
      description: {
        component:
          "Horizontal shared-state strip for setup, lobby, and active-turn messaging. Use `StateSurface` instead when the message needs more copy, actions, or recovery room."
      }
    }
  },
  render: (args) => <StatusBanner {...args} />
} satisfies Meta<typeof StatusBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {};

export const ActiveWithTimer: Story = {
  args: {
    tone: "active",
    eyebrow: "Your turn",
    headline: "Make your move.",
    copy: "Claim a route, build a station, or draw cards before the timer runs out.",
    timerLabel: "27s left"
  }
};

export const Waiting: Story = {
  args: {
    tone: "waiting",
    eyebrow: "Waiting",
    headline: "Another player is acting.",
    copy: "Use this for passive but still important shared-state moments.",
    timerLabel: "45s left"
  }
};

export const Warning: Story = {
  args: {
    tone: "warning",
    eyebrow: "Warning",
    headline: "Timer is almost out.",
    copy: "Urgency should rise without collapsing into failure styling.",
    timerLabel: "6s left"
  }
};

export const Failure: Story = {
  args: {
    tone: "danger",
    eyebrow: "Connection issue",
    headline: "Multiplayer setup needs attention.",
    copy: "Use failure banners for concise error states that do not need large recovery blocks."
  }
};
