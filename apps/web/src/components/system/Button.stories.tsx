import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";

const meta = {
  title: "System/Button",
  component: Button,
  args: {
    children: "Button"
  },
  parameters: {
    docs: {
      description: {
        component:
          "Primary and secondary authored shell control family. Use this for setup actions, modal actions, and turn controls without drifting into generic app CTA styling."
      }
    }
  },
  render: (args) => <Button {...args} />
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Secondary: Story = {
  args: {
    children: "Secondary action"
  }
};

export const Primary: Story = {
  args: {
    variant: "primary",
    children: "Primary action"
  }
};

export const Disabled: Story = {
  args: {
    children: "Disabled action",
    disabled: true
  }
};

export const LongLabel: Story = {
  args: {
    variant: "primary",
    children: "Create room and keep this table moving"
  }
};

export const Ghost: Story = {
  args: {
    variant: "ghost",
    children: "‹"
  }
};

export const GhostDisabled: Story = {
  args: {
    variant: "ghost",
    children: "›",
    disabled: true
  }
};

export const Link: Story = {
  args: {
    variant: "link",
    children: "First time? Open the rulebook →"
  }
};

export const LinkDisabled: Story = {
  args: {
    variant: "link",
    children: "Open the rulebook →",
    disabled: true
  }
};
