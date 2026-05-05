import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";
import { ModalShell } from "./ModalShell";
import { SectionHeader } from "./SectionHeader";

const meta = {
  title: "System/ModalShell",
  component: ModalShell,
  args: {
    variant: "default",
    width: "md",
    align: "center",
    children: null
  },
  parameters: {
    docs: {
      description: {
        component:
          "Overlay shell for ticket choice, handoff, and reveal moments. The shell is the full-screen layer; the inner card is the modal surface."
      }
    }
  },
  render: ({ variant, width, align }) => (
    <ModalShell variant={variant} width={width} align={align}>
      <SectionHeader eyebrow="Modal shell" title="Choose starting tickets" meta="Keep at least 2" variant="ceremony" />
      <p className="modal-copy">
        This is the default modal treatment used for overlays that need to feel like a distinct moment rather than another panel.
      </p>
      <div className="setup-actions" style={{ justifyContent: "center" }}>
        <Button>Back</Button>
        <Button variant="primary">Continue</Button>
      </div>
    </ModalShell>
  )
} satisfies Meta<typeof ModalShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Ceremony: Story = {
  args: {
    variant: "tutorial",
    width: "lg",
    align: "left"
  },
  render: ({ variant, width, align }) => (
    <ModalShell variant={variant} width={width} align={align}>
      <SectionHeader eyebrow="Table moment" title="Choose starting tickets" meta="Private choice" variant="ceremony" />
      <p className="modal-copy">
        Ceremony overlays use the same modal family but with stronger emphasis and a wider reading surface.
      </p>
      <div className="setup-actions">
        <Button>Back</Button>
        <Button variant="primary">Confirm tickets</Button>
      </div>
    </ModalShell>
  )
};
