import type { Preview } from "@storybook/react-vite";
import { createElement } from "react";
import "../src/styles/theme.css";
import "../src/styles.css";

const preview: Preview = {
  parameters: {
    controls: {
      expanded: true
    },
    layout: "padded",
    options: {
      storySort: {
        order: [
          "System",
          [
            "Primitives",
            [
              "StatusBanner",
              "StateSurface",
              "Panel",
              "SectionHeader",
              "Button",
              "FormField",
              "SurfaceCard",
              "ChoiceChipButton",
              "ModalShell",
              "Badge"
            ],
            "Game",
            [
              "BoardStage",
              "InspectorDock",
              "PlayerRoster",
              "SupplyDock",
              "CardSlot",
              "SeatTile",
              "SideTabRail",
              "NotificationStack",
              "GameOverPanel",
              "TicketSlip"
            ]
          ]
        ]
      }
    }
  },
  decorators: [
    (Story) =>
      createElement(
        "div",
        {
          style: {
            minHeight: "100vh",
            padding: "24px",
            background:
              "radial-gradient(circle at top left, rgba(255, 244, 216, 0.88), transparent 34%), radial-gradient(circle at bottom right, rgba(123, 166, 189, 0.18), transparent 26%), linear-gradient(180deg, #dfd0b3 0%, #c5b18f 100%)"
          }
        },
        createElement(
          "div",
          {
            style: {
              width: "min(1200px, 100%)",
              margin: "0 auto"
            }
          },
          createElement(Story)
        )
      )
  ]
};

export default preview;
