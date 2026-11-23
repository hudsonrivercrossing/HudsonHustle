const AVATAR_NAMES = ["Conductor", "Milo", "Engineer", "Rosa", "Switchman", "Jack", "Dispatcher", "Lily", "Caboose", "Nellie"];

function seededRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  return () => {
    h = ((h ^ (h >>> 16)) * 0x45d9f3b) | 0;
    h = ((h ^ (h >>> 16)) * 0x45d9f3b) | 0;
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

/**
 * The portraits for a table's seats, in seat order. The same seed always gives the same portraits,
 * so a room's lobby and its game show each player the same face.
 */
export function shuffleAvatars(seed: string, count: number): string[] {
  const rng = seededRandom(seed);
  const pool = [...AVATAR_NAMES];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}
