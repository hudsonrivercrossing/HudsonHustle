/** Card colours that are light enough to need dark ink on top of them. */
const LIGHT_COLORS = new Set(["ivory", "amber", "rose"]);

export function colorMarkInk(color: string): "dark" | "light" {
  return LIGHT_COLORS.has(color) ? "dark" : "light";
}

interface ColorMarkProps {
  color: string;
}

/**
 * The shape that stands for a card colour, so a colour is never told apart by hue alone.
 * Drawn around the origin inside a radius of 5; the caller places and scales it, and sets `color`.
 */
export function ColorMark({ color }: ColorMarkProps): JSX.Element | null {
  switch (color) {
    case "crimson":
      return <circle r="4.2" className="color-mark" />;
    case "amber":
      return <path d="M0 -4.6 L4.8 3.8 L-4.8 3.8 Z" className="color-mark" />;
    case "emerald":
      return <path d="M0 -5 L3.6 0 L0 5 L-3.6 0 Z" className="color-mark" />;
    case "violet":
      return <rect x="-3.8" y="-3.8" width="7.6" height="7.6" rx="0.6" className="color-mark" />;
    case "obsidian":
      return <path d="M-3.4 -3.4 L3.4 3.4 M3.4 -3.4 L-3.4 3.4" className="color-mark color-mark--line" />;
    case "ivory":
      return <circle r="3.3" className="color-mark color-mark--line" />;
    case "cobalt":
      return <path d="M-4 -2 H4 M-4 2 H4" className="color-mark color-mark--line" />;
    case "rose":
      return <path d="M0 4.4 C-6.2 0.2 -4.6 -4.6 -2.2 -4.3 C-1 -4.1 0 -3.2 0 -2 C0 -3.2 1 -4.1 2.2 -4.3 C4.6 -4.6 6.2 0.2 0 4.4 Z" className="color-mark" />;
    default:
      return null;
  }
}
