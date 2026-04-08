import type { CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChoiceChipButton } from "./ChoiceChipButton";

const meta = {
  title: "System/ChoiceChipButton",
  component: ChoiceChipButton,
  args: {
    children: "Claim with color"
  },
  parameters: {
    docs: {
      description: {
        component:
          "Compact action choice for route/city decisions. It should read as a decision token inside a detail surface, not as a general-purpose button."
      }
    }
  },
  render: (args) => <ChoiceChipButton {...args} />
} satisfies Meta<typeof ChoiceChipButton>;

export default meta;
type Story = StoryObj<typeof meta>;

const accent = (value: string): CSSProperties =>
  ({ "--choice-chip-accent": value } as CSSProperties);

export const NeutralAccent: Story = {
  args: {
    children: "Claim with gray",
    style: accent("rgba(80, 57, 34, 0.18)")
  }
};

export const RouteColors: Story = {
  render: () => (
    <div className="choice-chip-row">
      <ChoiceChipButton style={accent("#3d7e52")}>Claim with green</ChoiceChipButton>
      <ChoiceChipButton style={accent("#3d72b3")}>Claim with blue</ChoiceChipButton>
      <ChoiceChipButton style={accent("#b08a43")}>Claim with gold</ChoiceChipButton>
      <ChoiceChipButton style={accent("#8b5a9e")}>Claim with purple</ChoiceChipButton>
    </div>
  )
};

export const Selected: Story = {
  args: {
    children: "Build with blue",
    style: accent("#2a6fb6")
  }
};
