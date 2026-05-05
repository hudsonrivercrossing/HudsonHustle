import { useEffect, useState, type ReactNode } from "react";
import { FormField } from "../system/FormField";
import { Panel } from "../system/Panel";
import { SectionHeader } from "../system/SectionHeader";
import { SideTabRail } from "../system/game";

type InspectorTab = "market" | "build" | "chat";

interface InspectorDockProps {
  summary: string | null;
  className?: string;
  marketContent: ReactNode;
  buildContent: ReactNode;
  activeBuildKey?: string | null;
  chatMessages?: Array<{ id: string; playerName: string; message: string }>;
  onSendChat?: (message: string) => void;
  turnNumber?: number;
  currentPlayerName?: string;
  deckCount?: number;
  ticketDeckCount?: number;
}

export function InspectorDock({
  summary,
  className = "",
  marketContent,
  buildContent,
  activeBuildKey = null,
  chatMessages = [],
  onSendChat,
  turnNumber,
  currentPlayerName,
  deckCount,
  ticketDeckCount
}: InspectorDockProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<InspectorTab>("market");
  const [chatDraft, setChatDraft] = useState("");

  useEffect(() => {
    if (activeBuildKey) {
      setActiveTab("build");
    }
  }, [activeBuildKey]);

  return (
    <Panel variant="info" className={["inspector-dock", `inspector-dock--${activeTab}`, className].filter(Boolean).join(" ")}>
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
      {summary ? <p className="inspector-dock__summary">{summary}</p> : null}
      {activeTab === "market" ? (
        <div className="inspector-dock__body" role="tabpanel" aria-label="Market">
          {marketContent}
        </div>
      ) : activeTab === "build" ? (
        <div className="inspector-dock__body" role="tabpanel" aria-label="Build">
          {buildContent}
        </div>
      ) : (
        <div className="inspector-dock__body inspector-dock__body--chat" role="tabpanel" aria-label="Chat">
          <form
            className="chat-panel"
            onSubmit={(event) => {
              event.preventDefault();
              const message = chatDraft.trim();
              if (!message || !onSendChat) {
                return;
              }
              onSendChat(message);
              setChatDraft("");
            }}
          >
            <SectionHeader title="Chat" variant="compact" />
            <div className="chat-panel__messages" aria-label="Chat messages">
              {chatMessages.length > 0 ? (
                chatMessages.map((message) => (
                  <p key={message.id} className="chat-panel__message">
                    <strong>{message.playerName}</strong>
                    <span>{message.message}</span>
                  </p>
                ))
              ) : (
                <p className="chat-panel__message chat-panel__message--system">
                  {onSendChat ? "No room messages yet." : "Local play — no chat."}
                </p>
              )}
            </div>
            {onSendChat ? (
              <FormField as="div" label="Message" className="chat-panel__composer">
                <input
                  type="text"
                  placeholder="Message room"
                  value={chatDraft}
                  maxLength={280}
                  onChange={(event) => setChatDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && chatDraft.trim().length > 0) {
                      event.preventDefault();
                      onSendChat(chatDraft.trim());
                      setChatDraft("");
                    }
                  }}
                />
              </FormField>
            ) : null}
          </form>
        </div>
      )}
      <div className="inspector-dock__footer">
        {currentPlayerName ? <span className="inspector-dock__footer-stat">{currentPlayerName}</span> : null}
        {turnNumber != null ? <span className="inspector-dock__footer-stat">Turn {turnNumber}</span> : null}
        {deckCount != null ? <span className="inspector-dock__footer-stat">{deckCount} cards</span> : null}
        {ticketDeckCount != null ? <span className="inspector-dock__footer-stat">{ticketDeckCount} tickets</span> : null}
      </div>
    </Panel>
  );
}
