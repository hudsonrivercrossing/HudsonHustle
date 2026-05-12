import { useState } from "react";
import { Panel } from "../primitives/Panel";
import { SectionHeader } from "../primitives/SectionHeader";

interface ChatMessage {
  id: string;
  playerName: string;
  message: string;
}

interface ChatPanelProps {
  messages?: ChatMessage[];
  onSendMessage?: (message: string) => void;
  className?: string;
}

export function ChatPanel({ messages = [], onSendMessage, className = "" }: ChatPanelProps): JSX.Element {
  const [draft, setDraft] = useState("");

  return (
    <Panel variant="private" className={["chat-panel-dock", className].filter(Boolean).join(" ")}>
      <form
        className="chat-panel"
        onSubmit={(event) => {
          event.preventDefault();
          const message = draft.trim();
          if (!message || !onSendMessage) return;
          onSendMessage(message);
          setDraft("");
        }}
      >
        <SectionHeader title="Chat" variant="compact" />
        <div className="chat-panel__messages" aria-label="Chat messages">
          {messages.length > 0 ? (
            messages.map((msg) => (
              <p key={msg.id} className="chat-panel__message">
                <strong>{msg.playerName}</strong>
                <span>{msg.message}</span>
              </p>
            ))
          ) : (
            <p className="chat-panel__message chat-panel__message--system">
              {onSendMessage ? "No messages yet." : "Local play — no chat."}
            </p>
          )}
        </div>
        {onSendMessage ? (
          <div className="chat-panel__composer">
            <input
              type="text"
              placeholder="Message room"
              aria-label="Message"
              value={draft}
              maxLength={280}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && draft.trim().length > 0) {
                  event.preventDefault();
                  onSendMessage(draft.trim());
                  setDraft("");
                }
              }}
            />
          </div>
        ) : null}
      </form>
    </Panel>
  );
}
