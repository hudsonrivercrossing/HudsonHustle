import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { SideTabRail } from "./SideTabRail";

const meta = {
  title: "System/Game/SideTabRail",
  component: SideTabRail,
  parameters: {
    docs: {
      description: {
        component:
          "Physical right-rail tab spine for gameplay modules. It owns tab semantics while feature panels own the content."
      }
    }
  }
} satisfies Meta<typeof SideTabRail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const GameplayTabs: Story = {
  args: {
    ariaLabel: "Right rail modules",
    activeTab: "market",
    onChange: () => undefined,
    tabs: [
      { id: "market", label: "Market" },
      { id: "build", label: "Build" },
      { id: "chat", label: "Chat" }
    ]
  },
  render: () => {
    const [activeTab, setActiveTab] = useState<"market" | "build" | "chat">("market");
    return (
      <SideTabRail
        ariaLabel="Right rail modules"
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: "market", label: "Market" },
          { id: "build", label: "Build" },
          { id: "chat", label: "Chat" }
        ]}
      />
    );
  }
};
