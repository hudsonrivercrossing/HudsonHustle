import { Badge, type BadgeProps } from "./Badge";

/**
 * @deprecated Use Badge. Chip remains as a compatibility alias for existing lobby code.
 */
export function Chip(props: BadgeProps): JSX.Element {
  return <Badge {...props} />;
}
