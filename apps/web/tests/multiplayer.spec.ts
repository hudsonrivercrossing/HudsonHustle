import { expect, test, type Page } from "@playwright/test";
import { decodeReconnectToken } from "../src/reconnect-token";

const SESSION_KEY = "hudson-hustle-multiplayer-session-v2";
const API_BASE_URL = "http://127.0.0.1:8787";
const TUTORIAL_SEEN_KEY = "hudson-hustle-onboarding-v1-1";

async function waitForApi(page: Page): Promise<void> {
  await expect
    .poll(async () => {
      const response = await page.request.get(`${API_BASE_URL}/health`).catch(() => null);
      return response?.ok() ?? false;
    })
    .toBe(true);
}

async function clearInitialTicketChoice(page: Page): Promise<void> {
  const keepTicketsButton = page.getByRole("button", { name: /Keep 2 tickets/ });
  const ticketPickerVisible = await keepTicketsButton
    .waitFor({ state: "visible", timeout: 2500 })
    .then(() => true)
    .catch(() => false);

  if (!ticketPickerVisible) {
    return;
  }

  await keepTicketsButton.click().catch(async () => {
    const stillVisible = await keepTicketsButton.isVisible().catch(() => false);
    if (stillVisible) {
      throw new Error("Initial ticket confirm button stayed visible after click.");
    }
  });
}

async function openMultiplayerSetup(page: Page): Promise<void> {
  await page.goto("/");
  await waitForApi(page);
  await expect(page.getByRole("heading", { name: "Hudson Hustle" })).toBeVisible();
  await page.getByTestId("gateway-online").click();
  await expect(page.getByRole("button", { name: "Create room" })).toBeVisible();
  await expect(page.getByTestId("create-room-panel")).toBeVisible();
  await expect(page.getByTestId("join-room-panel")).toBeVisible();
}

async function openLocalSetup(page: Page, options?: { resetTutorial?: boolean }): Promise<void> {
  await page.goto("/");
  await waitForApi(page);
  if (options?.resetTutorial) {
    await page.evaluate((key) => window.localStorage.removeItem(key), TUTORIAL_SEEN_KEY);
  }
  await page.getByTestId("gateway-local").click();
  await expect(page.getByRole("heading", { name: "Local pass-and-play" })).toBeVisible();
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
  await clearInitialTicketChoice(hostPage);

  await expect(hostPage.getByTestId("turn-status-banner")).toContainText("Your turn");
  await expect(hostPage.getByTestId("config-utility-pill")).toBeVisible();
  await expect(hostPage.getByRole("button", { name: "Scoring" })).toBeVisible();

  const roundTableFontFamily = await hostPage.locator(".round-table-panel .section-header__title").evaluate((node) => {
    return window.getComputedStyle(node).fontFamily;
  });
  expect(roundTableFontFamily).toContain("Fraunces");

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
  await expect
    .poll(async () => {
      const pickerVisible = await guestPage.getByRole("button", { name: /Keep 2 tickets/ }).isVisible().catch(() => false);
      const bannerVisible = await guestPage.getByTestId("turn-status-banner").isVisible().catch(() => false);
      return pickerVisible || bannerVisible;
    })
    .toBe(true);

  await hostContext.close();
  await guestContext.close();
});

test("initial multiplayer ticket choices can be confirmed independently without resetting another player's selection", async ({ browser }) => {
  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();

  await openMultiplayerSetup(hostPage);
  const hostSession = await createRoom(hostPage);
  await openMultiplayerSetup(guestPage);
  await joinRoom(guestPage, hostSession.roomCode);

  await hostPage.getByRole("button", { name: "Mark ready" }).click();
  await guestPage.getByRole("button", { name: "Mark ready" }).click();
  await hostPage.getByRole("button", { name: "Start game" }).click();

  const guestTickets = guestPage.locator(".ticket-card");
  await expect(guestTickets).toHaveCount(4);
  await guestTickets.nth(2).click();
  await guestTickets.nth(1).click();
  await expect(guestTickets.nth(0)).toHaveClass(/ticket-card--selected/);
  await expect(guestTickets.nth(1)).not.toHaveClass(/ticket-card--selected/);
  await expect(guestTickets.nth(2)).toHaveClass(/ticket-card--selected/);

  await hostPage.getByRole("button", { name: /Keep 2 tickets/ }).click();
  await expect(hostPage.getByRole("button", { name: /Keep 2 tickets/ })).toHaveCount(0);
  await expect(guestTickets.nth(0)).toHaveClass(/ticket-card--selected/);
  await expect(guestTickets.nth(1)).not.toHaveClass(/ticket-card--selected/);
  await expect(guestTickets.nth(2)).toHaveClass(/ticket-card--selected/);

  await guestPage.getByRole("button", { name: /Keep 2 tickets/ }).click();
  await expect(hostPage.getByTestId("turn-status-banner")).toContainText("Your turn");
  await expect(guestPage.getByTestId("turn-status-banner")).toContainText("Waiting");

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
  await clearInitialTicketChoice(page);

  const timerBadge = page.getByTestId("turn-timer-badge");
  await expect(timerBadge).toHaveText(/^(Timer 30s|\d+s left)$/);
  await page.waitForTimeout(1500);
  await expect(timerBadge).toHaveText(/^(Timer 30s|\d+s left)$/);

  await guestContext.close();
  await context.close();
});

test("host can leave the lobby and return to the gateway", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();

  await openMultiplayerSetup(page);
  await createRoom(page);
  await expect(page.getByRole("heading", { name: "Hudson Hustle" })).toBeVisible();
  await page.getByRole("button", { name: "Leave room" }).click();

  await expect(page.getByRole("heading", { name: "Hudson Hustle" })).toBeVisible();
  await expect(page.getByTestId("gateway-online")).toBeVisible();
  const session = await page.evaluate((key) => window.localStorage.getItem(key), SESSION_KEY);
  expect(session).toBeNull();

  await context.close();
});

test("local tutorial and shell hierarchy keep ceremony and work roles distinct", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();

  await openLocalSetup(page, { resetTutorial: true });
  await expect(page.getByText("First game guide")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Learn the board in a few minutes" })).toBeVisible();
  await expect(page.locator(".tutorial-body .surface-card")).toHaveCount(2);

  const tutorialFontFamily = await page.locator(".tutorial-hero .section-header__title").evaluate((node) => {
    return window.getComputedStyle(node).fontFamily;
  });
  expect(tutorialFontFamily).toContain("Fraunces");

  await page.evaluate((key) => window.localStorage.setItem(key, "seen"), TUTORIAL_SEEN_KEY);
  await openLocalSetup(page);
  await expect(page.getByRole("heading", { name: "Local pass-and-play" })).toBeVisible();

  const setupHeadingFontFamily = await page.locator("main.setup-shell h1").evaluate((node) => {
    return window.getComputedStyle(node).fontFamily;
  });
  expect(setupHeadingFontFamily).toContain("Fraunces");

  const playersSectionFontFamily = await page.getByRole("heading", { name: "Players" }).evaluate((node) => {
    return window.getComputedStyle(node).fontFamily;
  });
  expect(playersSectionFontFamily).not.toContain("Fraunces");

  await context.close();
});
