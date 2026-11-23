import { useEffect, type RefObject } from "react";

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface DialogFocusOptions {
  /** Keep Tab inside the container. Off for a panel that sits beside content the user may still reach. */
  trap?: boolean;
  onEscape?: () => void;
}

/**
 * Moves focus into a dialog when it opens and gives it back to whatever had it when the dialog closes.
 * With `trap`, Tab cycles inside the dialog, so the page behind cannot be reached by keyboard.
 */
export function useDialogFocus(containerRef: RefObject<HTMLElement>, { trap = false, onEscape }: DialogFocusOptions = {}): void {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const previous = document.activeElement instanceof HTMLElement || document.activeElement instanceof SVGElement ? document.activeElement : null;
    const first = container.querySelector<HTMLElement>("[data-autofocus]") ?? container.querySelector<HTMLElement>(FOCUSABLE) ?? container;
    first.focus({ preventScroll: true });

    return () => {
      // Only hand focus back if it is still inside the dialog; the user may have moved on already.
      if (previous && previous.isConnected && (container.contains(document.activeElement) || document.activeElement === document.body)) {
        previous.focus({ preventScroll: true });
      }
    };
  }, [containerRef]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const container = containerRef.current;
      if (!container) {
        return;
      }
      if (event.key === "Escape" && onEscape) {
        event.stopPropagation();
        onEscape();
        return;
      }
      if (!trap || event.key !== "Tab") {
        return;
      }
      const items = [...container.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((item) => item.offsetParent !== null);
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (!container.contains(active)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [containerRef, trap, onEscape]);
}
