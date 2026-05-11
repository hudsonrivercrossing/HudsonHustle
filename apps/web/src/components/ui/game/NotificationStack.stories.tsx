import type { Meta, StoryObj } from "@storybook/react-vite";
import { NotificationStack } from "./NotificationStack";

const meta = {
  title: "System/Game/NotificationStack",
  component: NotificationStack,
  args: {
    notifications: [
      { id: "1", message: "Host claimed Chelsea to World Trade.", tone: "neutral" },
      { id: "2", message: "10 seconds left.", tone: "warning" },
      { id: "3", message: "Final scores are in.", tone: "success" }
    ]
  },
  parameters: {
    docs: {
      description: {
        component:
          "Floating gameplay notification stack. The feature layer owns timing and message generation; this component owns visual stacking and aria-live behavior."
      }
    }
  },
  render: (args) => <NotificationStack {...args} />
} satisfies Meta<typeof NotificationStack>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pipe: Story = {};
