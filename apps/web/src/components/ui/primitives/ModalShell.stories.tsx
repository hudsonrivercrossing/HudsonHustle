import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";
import { ModalShell } from "./ModalShell";
import { SectionHeader } from "./SectionHeader";

const meta = {
  title: "System/Primitives/ModalShell",
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

export const MdLeft: Story = {
  args: { width: "md", align: "left" },
  render: ({ variant, width, align }) => (
    <ModalShell variant={variant} width={width} align={align}>
      <SectionHeader eyebrow="Modal shell" title="Choose starting tickets" meta="Keep at least 2" variant="ceremony" />
      <p className="modal-copy">Left-aligned text works better for longer instructional copy that needs a natural reading axis.</p>
      <div className="setup-actions">
        <Button>Back</Button>
        <Button variant="primary">Continue</Button>
      </div>
    </ModalShell>
  )
};

export const LgCenter: Story = {
  args: { width: "lg", align: "center" },
  render: ({ variant, width, align }) => (
    <ModalShell variant={variant} width={width} align={align}>
      <SectionHeader eyebrow="Modal shell" title="Choose starting tickets" meta="Keep at least 2" variant="ceremony" />
      <p className="modal-copy">Wide centered layout — for choice moments with multiple options displayed side by side.</p>
      <div className="setup-actions" style={{ justifyContent: "center" }}>
        <Button>Back</Button>
        <Button variant="primary">Continue</Button>
      </div>
    </ModalShell>
  )
};

export const LgLeft: Story = {
  args: { width: "lg", align: "left" },
  render: ({ variant, width, align }) => (
    <ModalShell variant={variant} width={width} align={align}>
      <SectionHeader eyebrow="Modal shell" title="Choose starting tickets" meta="Keep at least 2" variant="ceremony" />
      <p className="modal-copy">Wide left-aligned — maximum reading surface for complex instructional overlays.</p>
      <div className="setup-actions">
        <Button>Back</Button>
        <Button variant="primary">Continue</Button>
      </div>
    </ModalShell>
  )
};

export const Tutorial: Story = {
  args: { variant: "tutorial", width: "lg", align: "left" },
  render: ({ variant, width, align }) => (
    <ModalShell variant={variant} width={width} align={align}>
      <SectionHeader eyebrow="Table moment" title="Choose starting tickets" meta="Private choice" variant="ceremony" />
      <p className="modal-copy">
        Tutorial overlays use the same modal family but with stronger emphasis and a wider reading surface.
      </p>
      <div className="setup-actions">
        <Button>Back</Button>
        <Button variant="primary">Confirm tickets</Button>
      </div>
    </ModalShell>
  )
};
