import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";
import { ModalShell } from "./ModalShell";
import { SectionHeader } from "./SectionHeader";

const meta = {
  title: "System/ModalShell",
  component: ModalShell,
  args: {
    tone: "default",
    width: "md",
    align: "center",
    children: null
  },
  parameters: {
    docs: {
      description: {
        component:
          "Overlay shell for ticket choice, handoff, reveal, and tutorial moments. The shell is the full-screen layer; the inner card is the modal surface."
      }
    }
  },
  render: ({ tone, width, align }) => (
    <ModalShell tone={tone} width={width} align={align}>
      <SectionHeader eyebrow="Modal shell" title="Choose starting tickets" meta="Keep at least 2" density="ceremony" />
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

export const Tutorial: Story = {
  args: {
    tone: "tutorial",
    width: "lg",
    align: "left"
  },
  render: ({ tone, width, align }) => (
    <ModalShell tone={tone} width={width} align={align}>
      <SectionHeader eyebrow="First game guide" title="Learn the board in a few minutes" meta="Guided tutorial" density="ceremony" />
      <p className="modal-copy">
        Tutorial overlays use the same modal family but with stronger ceremony and a wider reading surface.
      </p>
      <div className="setup-actions">
        <Button>Skip</Button>
        <Button variant="primary">Start tutorial</Button>
      </div>
    </ModalShell>
  )
};
