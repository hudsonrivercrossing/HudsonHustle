import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";
import { Chip } from "./Chip";
import { ChoiceChipButton } from "./ChoiceChipButton";
import { Panel } from "./Panel";
import { SectionHeader } from "./SectionHeader";
import { SurfaceCard } from "./SurfaceCard";

const meta = {
  title: "System/SurfaceCard",
  component: SurfaceCard,
  args: {
    variant: "detail",
    eyebrow: "Route detail",
    title: "Hoboken to Jamaica",
    meta: "10 points",
    children: null
  },
  parameters: {
    docs: {
      description: {
        component:
          "Nested authored surface for route/city/tunnel/endgame moments. `SurfaceCard` lives inside a `Panel`; it should feel like the decision object, not the outer shell."
      }
    }
  },
  render: ({ variant, eyebrow, title, meta: cardMeta }) => (
    <Panel variant="neutral" style={{ maxWidth: 720 }}>
      <SectionHeader eyebrow="Panel + detail surface" title="SurfaceCard" meta="nested authored object" />
      <SurfaceCard variant={variant} eyebrow={eyebrow} title={title} meta={cardMeta}>
        <p className="muted-copy">
          Use this for route detail, city detail, tunnel reveal, and endgame summary moments.
        </p>
        <div className="chip-row">
          <Chip tone="info">Rail</Chip>
          <Chip tone="success">Claimable</Chip>
          <Chip tone="warning">10 points</Chip>
        </div>
        <div className="chip-row">
          <ChoiceChipButton style={{ ["--choice-chip-accent" as string]: "#3d7e52" }}>Claim with green</ChoiceChipButton>
          <ChoiceChipButton style={{ ["--choice-chip-accent" as string]: "#3d72b3" }}>Claim with blue</ChoiceChipButton>
        </div>
        <Button variant="primary">Confirm choice</Button>
      </SurfaceCard>
    </Panel>
  )
} satisfies Meta<typeof SurfaceCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Detail: Story = {};

export const Summary: Story = {
  args: {
    variant: "summary",
    eyebrow: "Final score",
    title: "Mina",
    meta: "Winner"
  }
};
