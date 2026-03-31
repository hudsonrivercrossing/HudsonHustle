export interface RandomResult<T> {
  nextState: number;
  value: T;
}

export function nextRandom(state: number): RandomResult<number> {
  const nextState = (Math.imul(state, 1664525) + 1013904223) >>> 0;
  return {
    nextState,
    value: nextState / 0xffffffff
  };
}

export function shuffleWithSeed<T>(items: T[], seed: number): RandomResult<T[]> {
  const array = [...items];
  let currentSeed = seed >>> 0;

  for (let index = array.length - 1; index > 0; index -= 1) {
    const random = nextRandom(currentSeed);
    currentSeed = random.nextState;
    const swapIndex = Math.floor(random.value * (index + 1));
    [array[index], array[swapIndex]] = [array[swapIndex], array[index]];
  }

  return {
    nextState: currentSeed,
    value: array
  };
}
