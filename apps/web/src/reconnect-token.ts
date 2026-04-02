export interface ReconnectCredentials {
  roomCode: string;
  seatId: string;
  playerSecret: string;
}

const reconnectTokenPrefix = "hh1.";

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function base64UrlEncode(bytes: Uint8Array): string {
  return bytesToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}

function base64UrlDecode(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = `${normalized}${"=".repeat((4 - (normalized.length % 4)) % 4)}`;
  return base64ToBytes(padded);
}

function parseReconnectPayload(payload: unknown): ReconnectCredentials {
  if (!payload || typeof payload !== "object") {
    throw new Error("Reconnect token payload is invalid.");
  }

  const { roomCode, seatId, playerSecret } = payload as Record<string, unknown>;
  if (typeof roomCode !== "string" || typeof seatId !== "string" || typeof playerSecret !== "string") {
    throw new Error("Reconnect token payload is missing required fields.");
  }

  return { roomCode, seatId, playerSecret };
}

export function encodeReconnectToken(credentials: ReconnectCredentials): string {
  const payload = JSON.stringify({
    roomCode: credentials.roomCode,
    seatId: credentials.seatId,
    playerSecret: credentials.playerSecret
  });
  return `${reconnectTokenPrefix}${base64UrlEncode(new TextEncoder().encode(payload))}`;
}

export function decodeReconnectToken(token: string): ReconnectCredentials {
  const trimmed = token.trim();
  if (!trimmed.startsWith(reconnectTokenPrefix)) {
    throw new Error("Reconnect token must start with hh1.");
  }

  const payloadPart = trimmed.slice(reconnectTokenPrefix.length);
  if (!payloadPart) {
    throw new Error("Reconnect token is missing payload.");
  }

  let decodedPayload: string;
  try {
    decodedPayload = new TextDecoder().decode(base64UrlDecode(payloadPart));
  } catch {
    throw new Error("Reconnect token payload is not valid base64url.");
  }

  let parsedPayload: unknown;
  try {
    parsedPayload = JSON.parse(decodedPayload) as unknown;
  } catch {
    throw new Error("Reconnect token payload is not valid JSON.");
  }

  return parseReconnectPayload(parsedPayload);
}

export function readReconnectCredentials(raw: string | null): ReconnectCredentials | null {
  if (!raw) {
    return null;
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith(reconnectTokenPrefix)) {
    return decodeReconnectToken(trimmed);
  }

  try {
    const parsed = JSON.parse(trimmed) as Partial<ReconnectCredentials>;
    if (typeof parsed.roomCode === "string" && typeof parsed.seatId === "string" && typeof parsed.playerSecret === "string") {
      return {
        roomCode: parsed.roomCode,
        seatId: parsed.seatId,
        playerSecret: parsed.playerSecret
      };
    }
  } catch {
    return null;
  }

  return null;
}
