export function longestMatchCharsFromStart(base: string, candidate: string) {
  const minLen = Math.min(base.length, candidate.length);
  const matchedChars = [];
  for (let i = 0; i < minLen; i++) {
    const c1 = base[i];
    const c2 = candidate[i];
    if (c1 === c2) {
      matchedChars.push(c1);
    } else {
      break;
    }
  }
  return matchedChars;
}