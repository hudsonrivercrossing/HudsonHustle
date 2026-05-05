import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";
import { StateSurface } from "./StateSurface";

const meta = {
  title: "System/StateSurface",
  component: StateSurface,
  args: {
    tone: "neutral",
    eyebrow: "Shared laptop session",
    headline: "Pass the board between rivals.",
    copy: "Use this for larger setup, lobby, reconnect, and empty-detail moments that need more narrative room than a banner."
  },
  parameters: {
    docs: {
      description: {
        component:
          "Larger state block for setup guidance, recovery, and empty/detail states. Use `StatusBanner` when the message should stay compact and horizontal."
      }
    }
  },
  render: (args) => <StateSurface {...args} />
} satisfies Meta<typeof StateSurface>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {
  args: {
    rightSlot: "Untimed"
  }
};

export const Recovery: Story = {
  args: {
    tone: "danger",
    eyebrow: "Reconnect",
    headline: "This room needs attention.",
    copy: "Use this for reconnect failures and larger error blocks that need copy plus a clear recovery path.",
    action: (
      <>
        <Button>Try again</Button>
        <Button variant="primary">Paste token</Button>
      </>
    )
  }
};

export const EmptyDetail: Story = {
  args: {
    tone: "waiting",
    eyebrow: "Empty detail",
    headline: "Select a route or city.",
    copy: "Use this when the action rail should explain what to do next instead of showing a blank panel."
  }
};
