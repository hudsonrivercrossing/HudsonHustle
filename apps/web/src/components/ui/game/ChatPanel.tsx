import { useEffect, useRef, useState } from "react";
import { Panel } from "../primitives/Panel";
import { SectionHeader } from "../primitives/SectionHeader";

interface ChatMessage {
  id: string;
  seatId?: string;
  playerName: string;
  message: string;
}

interface ChatPanelProps {
  messages?: ChatMessage[];
  /** The viewer's own seat, so their messages can be told from everyone else's. */
  ownSeatId?: string | null;
  /** Absent when chat is off; false while the room connection is down. */
  onSendMessage?: (message: string) => void;
  canSend?: boolean;
  className?: string;
}

const MAX_MESSAGE_LENGTH = 280;

/** The room's chat: what was said, newest at the bottom and kept in view, and a line to say something. */
export function ChatPanel({ messages = [], ownSeatId = null, onSendMessage, canSend = true, className = "" }: ChatPanelProps): JSX.Element {
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const text = draft.trim();

  // A new message is brought into view, unless the reader has scrolled up to read older ones.
  const pinnedToEnd = useRef(true);
  useEffect(() => {
    const list = listRef.current;
    if (list && pinnedToEnd.current) {
      list.scrollTop = list.scrollHeight;
    }
  }, [messages.length]);

  return (
    <Panel variant="private" className={["chat-panel-dock", className].filter(Boolean).join(" ")}>
      <form
        className="chat-panel"
        onSubmit={(event) => {
          event.preventDefault();
          if (!text || !onSendMessage || !canSend) return;
          onSendMessage(text);
          setDraft("");
          pinnedToEnd.current = true;
        }}
      >
        <SectionHeader title="Chat" variant="compact" />
        <div
          ref={listRef}
          className="chat-panel__messages"
          role="log"
          aria-live="polite"
          aria-label="Chat messages"
          tabIndex={messages.length > 0 ? 0 : undefined}
          onScroll={(event) => {
            const list = event.currentTarget;
            pinnedToEnd.current = list.scrollHeight - list.scrollTop - list.clientHeight < 24;
          }}
        >
          {messages.length > 0 ? (
            messages.map((msg) => (
              <p key={msg.id} className={msg.seatId && msg.seatId === ownSeatId ? "chat-panel__message chat-panel__message--own" : "chat-panel__message"}>
                <strong>{msg.seatId && msg.seatId === ownSeatId ? "You" : msg.playerName}</strong> <span>{msg.message}</span>
              </p>
            ))
          ) : (
            <p className="chat-panel__empty">{onSendMessage ? "No messages yet. Say hello to the table." : "Local play has no chat."}</p>
          )}
        </div>
        {onSendMessage ? (
          <div className="chat-panel__composer">
            <input
              type="text"
              placeholder={canSend ? "Message the table" : "Reconnecting…"}
              aria-label="Message"
              value={draft}
              maxLength={MAX_MESSAGE_LENGTH}
              autoComplete="off"
              enterKeyHint="send"
              disabled={!canSend}
              onChange={(event) => setDraft(event.target.value)}
            />
            <button type="submit" className="chat-panel__send" disabled={!text || !canSend}>
              Send
            </button>
          </div>
        ) : null}
      </form>
    </Panel>
  );
}
