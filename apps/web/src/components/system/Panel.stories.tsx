import type { Meta, StoryObj } from "@storybook/react-vite";
import { Chip } from "./Chip";
import { Panel } from "./Panel";
import { SectionHeader } from "./SectionHeader";

const meta = {
  title: "System/Panel",
  component: Panel,
  args: {
    variant: "neutral",
    children: null
  },
  parameters: {
    docs: {
      description: {
        component:
          "Structural shell surface for setup, lobby, board framing, and side panels. `Panel` is the outer container; nested authored detail objects should use `SurfaceCard` instead."
      }
    }
  },
  render: ({ variant }) => (
    <Panel variant={variant} style={{ maxWidth: 560 }}>
      <SectionHeader eyebrow="Shell family" title="Panel surface" meta={`${variant} variant`} />
      <p className="muted-copy">
        Panels should feel structural and map-supporting. They are the outer shell layer, not the authored nested object layer.
      </p>
      <div className="chip-row">
        <Chip tone="info">Seat 2</Chip>
        <Chip tone="success">Connected</Chip>
      </div>
    </Panel>
  )
} satisfies Meta<typeof Panel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {};

export const Status: Story = {
  args: {
    variant: "status"
  }
};

export const PrivateInfo: Story = {
  args: {
    variant: "private-info"
  }
};

export const Alert: Story = {
  args: {
    variant: "alert"
  }
};
