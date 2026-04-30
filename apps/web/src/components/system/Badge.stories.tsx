import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "./Badge";

const meta = {
  title: "System/Badge",
  component: Badge,
  args: {
    tone: "neutral",
    children: "Seat 2"
  },
  parameters: {
    docs: {
      description: {
        component:
          "Compact object-level status mark for seats, tickets, connection state, and inline metadata. This replaces Chip as the foundation status primitive."
      }
    }
  },
  render: (args) => <Badge {...args} />
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {};

export const Info: Story = {
  args: {
    tone: "info",
    children: "Connected"
  }
};

export const Success: Story = {
  args: {
    tone: "success",
    children: "Ready"
  }
};

export const Warning: Story = {
  args: {
    tone: "warning",
    children: "Open"
  }
};

export const Danger: Story = {
  args: {
    tone: "danger",
    children: "Issue"
  }
};
