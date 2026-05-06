import { Button } from "../system/Button";
import { ModalShell } from "../system/ModalShell";
import { SectionHeader } from "../system/SectionHeader";

interface HandoffModalProps {
  mode: "postTurn" | "handoff";
  playerName: string;
  summary?: string | null;
  onAdvance: () => void;
  onReady: () => void;
}

export function HandoffModal({ mode, playerName, summary, onAdvance, onReady }: HandoffModalProps): JSX.Element {
  if (mode === "postTurn") {
    return (
      <ModalShell variant="default" width="md" align="center">
        <SectionHeader eyebrow="Turn complete" title={`${playerName}, pass the laptop.`} variant="ceremony" />
        <p>{summary ?? "Your action is locked in."}</p>
        <Button variant="primary" onClick={onAdvance}>
          I&apos;m done
        </Button>
      </ModalShell>
    );
  }

  return (
    <ModalShell variant="default" width="md" align="center">
      <SectionHeader eyebrow="Next player" title={`${playerName}, take over.`} variant="ceremony" />
      <p>The board is safe to look at. Private cards and tickets stay hidden until you are ready.</p>
      <Button variant="primary" onClick={onReady}>
        I&apos;m ready
      </Button>
    </ModalShell>
  );
}
