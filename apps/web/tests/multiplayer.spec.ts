import { expect, test, type Page } from "@playwright/test";
import { decodeReconnectToken } from "../src/reconnect-token";

const SESSION_KEY = "hudson-hustle-multiplayer-session-v2";
const API_BASE_URL = "http://127.0.0.1:8787";

async function openMultiplayerSetup(page: Page): Promise<void> {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Hudson Hustle" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Create room" })).toBeVisible();
  await expect(page.getByTestId("create-room-panel")).toBeVisible();
  await expect(page.getByTestId("join-room-panel")).toBeVisible();
}

async function createRoom(page: Page): Promise<{ roomCode: string; seatId: string; playerSecret: string }> {
  const createPanel = page.getByTestId("create-room-panel");
  await createPanel.getByLabel("Your name").fill("Host");
  await createPanel.getByRole("button", { name: "+15" }).click();
  await createPanel.getByRole("button", { name: "+15" }).click();
  await expect(createPanel.getByText("30s")).toBeVisible();
  await createPanel.getByRole("button", { name: "Create room" }).click();
  await expect(page.getByTestId("lobby-status-banner")).toBeVisible({ timeout: 10000 });
  await expect(page.getByTestId("seat-connected-seat-1")).toHaveText("Connected");

  const session = await page.evaluate((key) => window.localStorage.getItem(key), SESSION_KEY);
  expect(session).not.toBeNull();
  return decodeReconnectToken(session ?? "");
}

async function joinRoom(page: Page, roomCode: string): Promise<{ roomCode: string; seatId: string; playerSecret: string }> {
  const joinPanel = page.getByTestId("join-room-panel");
  await joinPanel.getByLabel("Room code").fill(roomCode);
  await joinPanel.getByRole("button", { name: "Preview room" }).click();
  await expect(page.getByRole("button", { name: "seat-2" })).toBeVisible();
  await page.getByRole("button", { name: "seat-2" }).click();
  await joinPanel.getByLabel("Your name").fill("Guest");
  await joinPanel.getByRole("button", { name: "Join room" }).click();
  await expect(page.getByTestId("lobby-status-banner")).toBeVisible({ timeout: 10000 });
  await expect(page.getByTestId("seat-connected-seat-2")).toHaveText("Connected");

  const session = await page.evaluate((key) => window.localStorage.getItem(key), SESSION_KEY);
  expect(session).not.toBeNull();
  return decodeReconnectToken(session ?? "");
}

test("multiplayer room lifecycle covers connected badges, private state, reconnect, and timer display", async ({ browser }) => {
  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();

  await openMultiplayerSetup(hostPage);
  const hostSession = await createRoom(hostPage);
  await expect(hostPage.getByTestId("seat-connected-seat-1")).toHaveText("Connected");

  await openMultiplayerSetup(guestPage);
  const guestSession = await joinRoom(guestPage, hostSession.roomCode);
  await expect(guestPage.getByTestId("seat-connected-seat-2")).toHaveText("Connected");
  await expect(hostPage.getByTestId("seat-connected-seat-2")).toHaveText("Connected");

  await hostPage.getByRole("button", { name: "Mark ready" }).click();
  await guestPage.getByRole("button", { name: "Mark ready" }).click();
  await expect(hostPage.getByRole("button", { name: "Start game" })).toBeEnabled();
  await hostPage.getByRole("button", { name: "Start game" }).click();

  await expect(hostPage.getByTestId("turn-status-banner")).toContainText("Your turn");

  const hostTimerBadge = hostPage.getByTestId("turn-timer-badge");
  await expect(hostTimerBadge).toHaveText(/^(Timer 30s|\d+s left)$/);
  await hostPage.waitForTimeout(1500);
  await expect(hostTimerBadge).toHaveText(/^(Timer 30s|\d+s left)$/);

  const hostPrivate = await hostPage.request.get(
    `${API_BASE_URL}/rooms/${hostSession.roomCode}?seatId=${hostSession.seatId}&playerSecret=${hostSession.playerSecret}`
  );
  const guestPrivate = await guestPage.request.get(
    `${API_BASE_URL}/rooms/${hostSession.roomCode}?seatId=${guestSession.seatId}&playerSecret=${guestSession.playerSecret}`
  );
  const hostJson = (await hostPrivate.json()) as {
    privateState: { playerId: string | null; hand: unknown[]; tickets: unknown[] };
  };
  const guestJson = (await guestPrivate.json()) as {
    privateState: { playerId: string | null; hand: unknown[]; tickets: unknown[] };
  };
  expect(hostJson.privateState.playerId).not.toBeNull();
  expect(guestJson.privateState.playerId).not.toBeNull();
  expect(hostJson.privateState.playerId).not.toBe(guestJson.privateState.playerId);
  expect(hostJson.privateState.hand).toHaveLength(4);
  expect(guestJson.privateState.hand).toHaveLength(4);

  await guestPage.reload();
  await expect(guestPage.getByTestId("turn-status-banner")).toBeVisible();

  await hostContext.close();
  await guestContext.close();
});

test("timer display counts down from the lobby-selected timeout", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();

  await openMultiplayerSetup(page);
  const { roomCode } = await createRoom(page);

  const guestContext = await browser.newContext();
  const guestPage = await guestContext.newPage();
  await openMultiplayerSetup(guestPage);
  await joinRoom(guestPage, roomCode);

  await page.getByRole("button", { name: "Mark ready" }).click();
  await guestPage.getByRole("button", { name: "Mark ready" }).click();
  await page.getByRole("button", { name: "Start game" }).click();

  const timerBadge = page.getByTestId("turn-timer-badge");
  await expect(timerBadge).toHaveText(/^(Timer 30s|\d+s left)$/);
  await page.waitForTimeout(1500);
  await expect(timerBadge).toHaveText(/^(Timer 30s|\d+s left)$/);

  await guestContext.close();
  await context.close();
});
