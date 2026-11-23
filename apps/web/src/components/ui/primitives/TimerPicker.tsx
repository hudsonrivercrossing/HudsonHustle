import { Button } from "./Button";

interface TimerPickerProps {
  value: number;
  onChange: (value: number) => void;
  step?: number;
}

export function TimerPicker({ value, onChange, step = 15 }: TimerPickerProps): JSX.Element {
  return (
    <div className="timer-picker" role="group" aria-label="Turn timer">
      <Button aria-label={`${step} seconds less`} onClick={() => onChange(Math.max(0, value - step))}>
        −{step}
      </Button>
      <output className="timer-picker__value" aria-live="polite">
        {value === 0 ? "Untimed" : `${value}s`}
      </output>
      <Button aria-label={`${step} seconds more`} onClick={() => onChange(value + step)}>
        +{step}
      </Button>
    </div>
  );
}
