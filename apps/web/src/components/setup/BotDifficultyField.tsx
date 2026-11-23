import { botDifficulties, type BotDifficulty } from "@hudson-hustle/game-core";
import { FormField } from "../ui/primitives/FormField";

const descriptions: Record<BotDifficulty, string> = {
  easy: "Plays a simple game and stays out of your way.",
  standard: "Builds toward its tickets at a steady pace.",
  hard: "Finishes long tickets and uses stations to get through."
};

const labels: Record<BotDifficulty, string> = { easy: "Easy", standard: "Standard", hard: "Hard" };

interface BotDifficultyFieldProps {
  value: BotDifficulty;
  onChange: (difficulty: BotDifficulty) => void;
}

/** One setting for every bot at the table. Shown only when the table has a bot. */
export function BotDifficultyField({ value, onChange }: BotDifficultyFieldProps): JSX.Element {
  return (
    <FormField label="Bot difficulty" helper={descriptions[value]}>
      <select value={value} onChange={(event) => onChange(event.target.value as BotDifficulty)}>
        {botDifficulties.map((difficulty) => (
          <option key={difficulty} value={difficulty}>
            {labels[difficulty]}
          </option>
        ))}
      </select>
    </FormField>
  );
}
