import type { Meta, StoryObj } from "@storybook/react-vite";
import { TicketSlip } from "./TicketSlip";

const meta = {
  title: "System/Game/TicketSlip",
  component: TicketSlip,
  args: {
    fromLabel: "Exchange Place",
    toLabel: "Jamaica",
    points: 14,
    status: "open"
  },
  parameters: {
    docs: {
      description: {
        component:
          "Game ticket object shared by the left ticket dock and draw-ticket choice sheet. Setup room-code plates use SetupTicketSlip."
      }
    }
  },
  render: (args) => <TicketSlip {...args} />
} satisfies Meta<typeof TicketSlip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {};

export const Connected: Story = {
  args: {
    status: "connected"
  }
};

export const KeepChoice: Story = {
  args: {
    status: "keep",
    fromLabel: "World Trade",
    toLabel: "Long Island City",
    points: 8
  }
};

export const Focused: Story = {
  args: {
    focused: true,
    status: "review",
    fromLabel: "Hudson Yards",
    toLabel: "Flushing",
    points: 8
  }
};
