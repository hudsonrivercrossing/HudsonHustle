import type { Meta, StoryObj } from "@storybook/react-vite";
import { FormField } from "./FormField";

const meta = {
  title: "System/FormField",
  component: FormField,
  parameters: {
    docs: {
      description: {
        component:
          "Label wrapper for system inputs. Use it for form controls that belong to the shell, not for gameplay state or object rows."
      }
    }
  },
  render: (args) => <FormField {...args} />
} satisfies Meta<typeof FormField>;

export default meta;
type Story = StoryObj<typeof meta>;

const inputStyle = {
  width: "100%"
} as const;

export const TextInput: Story = {
  args: {
    label: "Your name",
    children: <input defaultValue="Host" style={inputStyle} />
  }
};

export const Select: Story = {
  args: {
    label: "Players",
    children: (
      <select defaultValue="2" style={inputStyle}>
        <option value="2">2 players</option>
        <option value="3">3 players</option>
        <option value="4">4 players</option>
      </select>
    )
  }
};

export const ReconnectToken: Story = {
  args: {
    label: "Reconnect token",
    children: <input defaultValue="hh1.room.seat.secret" spellCheck={false} style={inputStyle} />
  }
};
