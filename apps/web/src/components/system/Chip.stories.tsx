import type { Meta, StoryObj } from "@storybook/react-vite";
import { Chip } from "./Chip";

const meta = {
  title: "System/Chip",
  component: Chip,
  args: {
    tone: "neutral",
    children: "Seat 2"
  },
  parameters: {
    docs: {
      description: {
        component:
          "Compact object-level state mark for rows, tickets, seats, and inline metadata. `Chip` is tighter and more state-like than `UtilityPill`."
      }
    }
  },
  render: (args) => <Chip {...args} />
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {};

export const Info: Story = {
  args: {
    tone: "info",
    children: "Seat 2"
  }
};

export const Success: Story = {
  args: {
    tone: "success",
    children: "Connected"
  }
};

export const Warning: Story = {
  args: {
    tone: "warning",
    children: "Pending"
  }
};

export const Danger: Story = {
  args: {
    tone: "danger",
    children: "Error"
  }
};
