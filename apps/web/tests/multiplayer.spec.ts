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
  await expect(page.getByRole("heading", { name: "Online" })).toBeVisible();
  await expect(page.getByTestId("online-mode-gateway")).toBeVisible();
  await expect(page.getByTestId("online-start-game")).toBeVisible();
  await expect(page.getByTestId("online-join-room")).toBeVisible();
}

async function openLocalSetup(page: Page, options?: { resetTutorial?: boolean }): Promise<void> {
  await page.goto("/");
  await waitForApi(page);
  if (options?.resetTutorial) {
    await page.evaluate((key) => window.localStorage.removeItem(key), TUTORIAL_SEEN_KEY);
  }
  await page.getByTestId("gateway-local").click();
  await expect(page.getByRole("heading", { name: "Pass-and-play" })).toBeVisible();
}

async function openJoinRoomPanel(page: Page) {
  await page.getByTestId("online-join-room").click();
  const joinPanel = page.getByTestId("join-room-panel");
  await expect(joinPanel).toBeVisible();
  return joinPanel;
}

async function createRoom(
  page: Page,
  options?: { timerAdjustments?: number; expectedTimerText?: string; botSeats?: string[]; playerCount?: 2 | 3 | 4 }
): Promise<{ roomCode: string; seatId: string; playerSecret: string }> {
  await page.getByTestId("online-start-game").click();
  const createPanel = page.getByTestId("create-room-panel");
  const timerAdjustments = options?.timerAdjustments ?? 2;
  const expectedTimerText = options?.expectedTimerText ?? "30s";
  const botSeats = new Set(options?.botSeats ?? []);
  const playerCount = options?.playerCount ?? 2;
  await createPanel.getByLabel("Your name").fill("Host");
  await createPanel.getByRole("button", { name: "Continue to seats" }).click();
  await createPanel.getByLabel("Players").selectOption(String(playerCount));
  for (const seatId of botSeats) {
    await createPanel.getByTestId(`seat-plan-toggle-${seatId}`).click();
  }
  await createPanel.getByRole("button", { name: "Continue to board" }).click();
  await createPanel.getByRole("button", { name: "Continue to timer" }).click();
  for (let index = 0; index < timerAdjustments; index += 1) {
    await createPanel.getByRole("button", { name: "+15" }).click();
  }
  await expect(createPanel.locator(".timer-picker__value")).toHaveText(expectedTimerText);
  await createPanel.getByRole("button", { name: "Create room" }).click();
  await expect(page.getByTestId("lobby-status-banner")).toBeVisible({ timeout: 10000 });
  await expect(page.getByTestId("seat-connected-seat-1")).toHaveText("Connected");

  const session = await page.evaluate((key) => window.localStorage.getItem(key), SESSION_KEY);
  expect(session).not.toBeNull();
  return decodeReconnectToken(session ?? "");
}

async function joinRoom(
  page: Page,
  roomCode: string,
  options?: { seatId?: string; playerName?: string }
): Promise<{ roomCode: string; seatId: string; playerSecret: string }> {
  const joinPanel = await openJoinRoomPanel(page);
  const seatId = options?.seatId ?? "seat-2";
  const playerName = options?.playerName ?? "Guest";
  await joinPanel.getByLabel("Room code").fill(roomCode);
  await joinPanel.getByRole("button", { name: "Preview" }).click();
  await expect(page.getByRole("button", { name: seatId })).toBeVisible();
  await page.getByRole("button", { name: seatId }).click();
  await joinPanel.getByRole("button", { name: "Continue to enter" }).click();
  await joinPanel.getByLabel("Your name").fill(playerName);
  await joinPanel.getByRole("button", { name: "Join room" }).click();
  await expect(page.getByTestId("lobby-status-banner")).toBeVisible({ timeout: 10000 });
  await expect(page.getByTestId(`seat-connected-${seatId}`)).toHaveText("Connected");

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
  await clearInitialTicketChoice(guestPage);

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

test("invalid saved reconnect tokens fall back to the gateway instead of crashing setup", async ({ browser }) => {
  const context = await browser.newContext();
  await context.addInitScript((sessionKey) => {
    window.localStorage.setItem(sessionKey, "hh1.not-valid-base64");
  }, SESSION_KEY);
  const page = await context.newPage();

  await page.goto("/");
  await waitForApi(page);
  await expect(page.getByRole("heading", { name: "Hudson Hustle" })).toBeVisible();
  await expect(page.getByTestId("gateway-online")).toBeVisible();

  await context.close();
});

test("switching from a failed join preview to create clears stale setup errors", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();

  await openMultiplayerSetup(page);
  const joinPanel = await openJoinRoomPanel(page);
  await joinPanel.getByLabel("Room code").fill("ABC123");
  await joinPanel.getByRole("button", { name: "Preview" }).click();
  await expect(page.getByText("Unknown room code.")).toBeVisible();

  await page.getByRole("button", { name: "Start game" }).click();
  await expect(page.getByTestId("create-room-panel")).toBeVisible();
  await expect(page.getByText("Unknown room code.")).toHaveCount(0);

  await context.close();
});

test("join flow clears stale seat selections when previewing a different room", async ({ browser }) => {
  const hostOneContext = await browser.newContext();
  const hostTwoContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const hostOnePage = await hostOneContext.newPage();
  const hostTwoPage = await hostTwoContext.newPage();
  const guestPage = await guestContext.newPage();

  await openMultiplayerSetup(hostOnePage);
  const firstRoom = await createRoom(hostOnePage, { playerCount: 3 });

  await openMultiplayerSetup(hostTwoPage);
  const secondRoom = await createRoom(hostTwoPage, { playerCount: 2 });

  await openMultiplayerSetup(guestPage);
  const joinPanel = await openJoinRoomPanel(guestPage);
  await joinPanel.getByLabel("Room code").fill(firstRoom.roomCode);
  await joinPanel.getByRole("button", { name: "Preview" }).click();
  const seatThreeButton = guestPage.getByRole("button", { name: "seat-3" });
  await seatThreeButton.click();
  await expect(seatThreeButton).toHaveClass(/chip-button--selected/);

  await guestPage.locator(".setup-mode-back").click();
  await expect(guestPage.getByTestId("online-mode-gateway")).toBeVisible();
  await guestPage.getByTestId("online-join-room").click();
  const roomCodeField = guestPage.getByTestId("join-room-panel").getByLabel("Room code");
  await expect(roomCodeField).toBeVisible();
  await roomCodeField.fill(secondRoom.roomCode);
  await guestPage.getByTestId("join-room-panel").getByRole("button", { name: "Preview" }).click();

  await expect(guestPage.getByText("1 open").first()).toBeVisible();
  await expect(guestPage.getByTestId("join-room-panel").getByRole("button", { name: "Continue to enter" })).toBeDisabled();
  await expect(guestPage.getByRole("button", { name: "seat-2" })).toBeVisible();

  await hostOneContext.close();
  await hostTwoContext.close();
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
  const { roomCode } = await createRoom(page, { timerAdjustments: 1, expectedTimerText: "15s" });

  const guestContext = await browser.newContext();
  const guestPage = await guestContext.newPage();
  await openMultiplayerSetup(guestPage);
  await joinRoom(guestPage, roomCode);

  await page.getByRole("button", { name: "Mark ready" }).click();
  await guestPage.getByRole("button", { name: "Mark ready" }).click();
  await page.getByRole("button", { name: "Start game" }).click();
  await clearInitialTicketChoice(page);
  await clearInitialTicketChoice(guestPage);

  const timerBadge = page.getByTestId("turn-timer-badge");
  await expect(timerBadge).toHaveText(/^(Timer 15s|\d+s left)$/);
  await page.getByRole("button", { name: "Draw from deck" }).click();
  await expect(timerBadge).toHaveText(/\d+s left/);
  await page.waitForTimeout(1500);
  await expect(timerBadge).toHaveText(/\d+s left/);

  await guestContext.close();
  await context.close();
});

test("drawing tickets in multiplayer offers no cancel path and still requires a keep decision", async ({ browser }) => {
  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();

  await openMultiplayerSetup(hostPage);
  const { roomCode } = await createRoom(hostPage);

  await openMultiplayerSetup(guestPage);
  await joinRoom(guestPage, roomCode);

  await hostPage.getByRole("button", { name: "Mark ready" }).click();
  await guestPage.getByRole("button", { name: "Mark ready" }).click();
  await hostPage.getByRole("button", { name: "Start game" }).click();
  await clearInitialTicketChoice(hostPage);
  await clearInitialTicketChoice(guestPage);

  await hostPage.getByRole("button", { name: "Draw tickets" }).click();
  await expect(hostPage.getByRole("button", { name: "Back" })).toHaveCount(0);
  await expect(hostPage.getByRole("button", { name: /Keep 1 ticket/ })).toBeVisible();

  const pickerCards = hostPage.locator(".ticket-card");
  await expect(pickerCards).toHaveCount(3);
  await pickerCards.nth(0).click();
  await expect(hostPage.getByRole("button", { name: /Keep 0 tickets/ })).toBeDisabled();
  await pickerCards.nth(1).click();
  await expect(hostPage.getByRole("button", { name: /Keep 1 ticket/ })).toBeEnabled();
  await hostPage.getByRole("button", { name: /Keep 1 ticket/ }).click();
  await expect(hostPage.getByRole("button", { name: /Keep 1 ticket/ })).toHaveCount(0);

  await guestContext.close();
  await hostContext.close();
});

test("host can leave the lobby without stranding the room", async ({ browser }) => {
  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const replacementContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();
  const replacementPage = await replacementContext.newPage();

  await openMultiplayerSetup(hostPage);
  const { roomCode } = await createRoom(hostPage);
  await openMultiplayerSetup(guestPage);
  await joinRoom(guestPage, roomCode);

  await hostPage.getByRole("button", { name: "Leave room" }).click();

  await expect(hostPage.getByRole("heading", { name: "Hudson Hustle" })).toBeVisible();
  await expect(hostPage.getByTestId("gateway-online")).toBeVisible();
  const session = await hostPage.evaluate((key) => window.localStorage.getItem(key), SESSION_KEY);
  expect(session).toBeNull();
  await expect(guestPage.getByTestId("seat-row-seat-1").getByText("Open seat")).toBeVisible();
  await expect(guestPage.getByTestId("seat-row-seat-2")).toContainText("host");

  await openMultiplayerSetup(replacementPage);
  await joinRoom(replacementPage, roomCode, {
    seatId: "seat-1",
    playerName: "Returner"
  });
  await expect(guestPage.getByTestId("seat-row-seat-1")).toContainText("Returner");

  await replacementContext.close();
  await guestContext.close();
  await hostContext.close();
});

test("normal setup can create a room with one bot seat and start with the host alone", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();

  await openMultiplayerSetup(page);
  await createRoom(page, { botSeats: ["seat-2"] });

  await expect(page.getByTestId("seat-row-seat-2")).toContainText("Bot 1");
  await expect(page.getByTestId("seat-connected-seat-2")).toHaveText("Server");

  await page.getByRole("button", { name: "Mark ready" }).click();
  await expect(page.getByRole("button", { name: "Start game" })).toBeEnabled();
  await page.getByRole("button", { name: "Start game" }).click();
  await clearInitialTicketChoice(page);

  await expect(page.getByTestId("turn-status-banner")).toBeVisible();
  await context.close();
});

test("normal setup can create a mixed room with multiple bot seats and only leave human seats joinable", async ({ browser }) => {
  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();

  await openMultiplayerSetup(hostPage);
  const { roomCode } = await createRoom(hostPage, {
    playerCount: 4,
    botSeats: ["seat-2", "seat-3"]
  });

  await expect(hostPage.getByTestId("seat-row-seat-2")).toContainText("Bot 1");
  await expect(hostPage.getByTestId("seat-row-seat-3")).toContainText("Bot 2");
  await expect(hostPage.getByTestId("seat-row-seat-4")).toContainText("Open seat");

  await openMultiplayerSetup(guestPage);
  const joinPanel = await openJoinRoomPanel(guestPage);
  await joinPanel.getByLabel("Room code").fill(roomCode);
  await joinPanel.getByRole("button", { name: "Preview" }).click();
  await expect(guestPage.getByRole("button", { name: "seat-4" })).toBeVisible();
  await expect(guestPage.getByRole("button", { name: "seat-2" })).toHaveCount(0);
  await expect(guestPage.getByRole("button", { name: "seat-3" })).toHaveCount(0);
  await guestPage.getByRole("button", { name: "seat-4" }).click();
  await joinPanel.getByRole("button", { name: "Continue to enter" }).click();
  await joinPanel.getByLabel("Your name").fill("Guest");
  await joinPanel.getByRole("button", { name: "Join room" }).click();

  await expect(guestPage.getByTestId("seat-row-seat-2")).toContainText("Bot 1");
  await expect(guestPage.getByTestId("seat-row-seat-3")).toContainText("Bot 2");
  await expect(guestPage.getByTestId("seat-row-seat-4")).toContainText("Guest");

  await guestContext.close();
  await hostContext.close();
});

test("timed mixed rooms hand off through bot turns and still allow human reconnect", async ({ browser }) => {
  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();

  await openMultiplayerSetup(hostPage);
  const { roomCode } = await createRoom(hostPage, {
    playerCount: 3,
    botSeats: ["seat-2"],
    timerAdjustments: 1,
    expectedTimerText: "15s"
  });

  await openMultiplayerSetup(guestPage);
  await joinRoom(guestPage, roomCode, {
    seatId: "seat-3",
    playerName: "Guest"
  });

  await hostPage.getByRole("button", { name: "Mark ready" }).click();
  await guestPage.getByRole("button", { name: "Mark ready" }).click();
  await hostPage.getByRole("button", { name: "Start game" }).click();
  await clearInitialTicketChoice(hostPage);
  await clearInitialTicketChoice(guestPage);

  await expect(hostPage.getByTestId("turn-status-banner")).toContainText("Your turn");
  await expect(guestPage.getByTestId("turn-status-banner")).toContainText("Waiting");

  await expect
    .poll(async () => {
      return guestPage.getByTestId("turn-status-banner").textContent();
    }, { timeout: 25000 })
    .toContain("Your turn");

  await guestPage.reload();
  await expect
    .poll(async () => {
      const pickerVisible = await guestPage.getByRole("button", { name: /Keep 2 tickets/ }).isVisible().catch(() => false);
      const bannerText = await guestPage.getByTestId("turn-status-banner").textContent().catch(() => null);
      return pickerVisible || (typeof bannerText === "string" && bannerText.includes("Your turn"));
    }, { timeout: 10000 })
    .toBe(true);

  await guestContext.close();
  await hostContext.close();
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
  await expect(page.getByRole("heading", { name: "Pass-and-play" })).toBeVisible();

  const setupHeadingFontFamily = await page.locator("main.setup-board-shell h1").evaluate((node) => {
    return window.getComputedStyle(node).fontFamily;
  });
  expect(setupHeadingFontFamily).toContain("IBM Plex Sans");

  const playersSectionFontFamily = await page.getByRole("heading", { name: "Seats" }).evaluate((node) => {
    return window.getComputedStyle(node).fontFamily;
  });
  expect(playersSectionFontFamily).not.toContain("Fraunces");

  await context.close();
});
