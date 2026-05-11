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

export const WithHelper: Story = {
  args: {
    label: "Timer",
    helper: "Enter seconds. 0 = untimed · 30 = 30 s · 60 = 1 min.",
    children: <input defaultValue="60" style={inputStyle} />
  }
};

export const ErrorState: Story = {
  args: {
    label: "Your name",
    error: "Name is required.",
    children: <input defaultValue="" style={inputStyle} />
  }
};

export const ErrorStateSelect: Story = {
  args: {
    label: "Map",
    error: "Please select a map before continuing.",
    children: (
      <select defaultValue="" style={inputStyle}>
        <option value="" disabled>
          Choose map…
        </option>
        <option value="hh1">Hudson Hustle v1</option>
      </select>
    )
  }
};

export const Disabled: Story = {
  args: {
    label: "Reconnect token",
    helper: "Provided by the host.",
    children: <input defaultValue="" disabled placeholder="Waiting for host…" style={inputStyle} />
  }
};
