import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "./Badge";
import { Panel } from "./Panel";
import { SectionHeader } from "./SectionHeader";

const meta = {
  title: "System/Primitives/Panel",
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
        <Badge tone="info">Seat 2</Badge>
        <Badge tone="success">Connected</Badge>
      </div>
    </Panel>
  )
} satisfies Meta<typeof Panel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {};

export const Info: Story = {
  args: {
    variant: "info"
  }
};

export const PrivateInfo: Story = {
  args: {
    variant: "private"
  }
};

export const Alert: Story = {
  args: {
    variant: "danger"
  }
};
