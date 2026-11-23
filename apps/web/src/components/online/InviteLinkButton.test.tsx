import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InviteLinkButton } from "./InviteLinkButton";

function stubClipboard(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
}

describe("InviteLinkButton", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("copies the room link, confirms it, then goes back to the idle label", async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);
    render(<InviteLinkButton roomCode="ABC123" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy invite link" }));
    });
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/room/ABC123`);
    expect(screen.getByRole("button", { name: "Link copied" })).toBeTruthy();
    expect(screen.queryByLabelText("Invite link")).toBeNull();

    act(() => {
      vi.advanceTimersByTime(1600);
    });
    expect(screen.getByRole("button", { name: "Copy invite link" })).toBeTruthy();
  });

  it("shows the link to copy by hand when the clipboard is refused", async () => {
    stubClipboard(() => Promise.reject(new Error("denied")));
    render(<InviteLinkButton roomCode="ABC123" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy invite link" }));
    });
    expect((screen.getByLabelText("Invite link") as HTMLInputElement).value).toBe(`${window.location.origin}/room/ABC123`);
    expect(screen.getByRole("button", { name: "Copy invite link" })).toBeTruthy();
  });
});
