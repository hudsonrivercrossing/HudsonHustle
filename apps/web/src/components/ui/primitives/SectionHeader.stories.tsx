import type { Meta, StoryObj } from "@storybook/react-vite";
import { SectionHeader } from "./SectionHeader";

const meta = {
  title: "System/Primitives/SectionHeader",
  component: SectionHeader,
  args: {
    eyebrow: "Shell family",
    title: "Section title",
    meta: "Optional metadata",
    variant: "standard"
  },
  parameters: {
    docs: {
      description: {
        component:
          "Header for shell sections. `compact` is for workhorse sections, `standard` is the default shell header, and `ceremony` is reserved for stronger authored moments."
      }
    }
  },
  render: (args) => (
    <div style={{ maxWidth: 560 }}>
      <SectionHeader {...args} />
    </div>
  )
} satisfies Meta<typeof SectionHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Standard: Story = {};

export const Compact: Story = {
  args: {
    eyebrow: "Table setup",
    title: "Players",
    meta: "2 seated",
    variant: "compact"
  }
};

export const Ceremony: Story = {
  args: {
    eyebrow: "Table status",
    title: "Round table",
    meta: "Mina active",
    variant: "ceremony"
  }
};

export const TitleOnly: Story = {
  args: {
    eyebrow: undefined,
    title: "Board",
    meta: undefined
  }
};
