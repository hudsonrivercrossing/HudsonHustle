import { Button } from "../ui/primitives/Button";
import { ModalShell } from "../ui/primitives/ModalShell";
import { SectionHeader } from "../ui/primitives/SectionHeader";

interface HandoffModalProps {
  playerName: string;
  /** What the previous player just did, so the table can follow along. */
  previousTurnSummary?: string | null;
  onReady: () => void;
}

/** Shown while the laptop changes hands: private info is covered until the next player says so. */
export function HandoffModal({ playerName, previousTurnSummary, onReady }: HandoffModalProps): JSX.Element {
  return (
    <ModalShell variant="default" width="md" align="center" aria-label={`${playerName}, take over`}>
      <SectionHeader eyebrow="Next player" title={`${playerName}, take over.`} variant="ceremony" />
      {previousTurnSummary ? <p>{previousTurnSummary}</p> : null}
      <p>The board is safe to look at. Your cards and tickets stay hidden until you are ready.</p>
      <Button variant="primary" onClick={onReady}>
        I&apos;m ready
      </Button>
    </ModalShell>
  );
}
