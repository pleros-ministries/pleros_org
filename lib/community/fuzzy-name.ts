/**
 * Forgiving name matching for the new-message picker (user request, 18 October):
 * every typed word must match some word of the name, by prefix, by containing it,
 * or within a small typo distance. Higher scores rank first.
 */

function normalise(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9\s'-]/g, " ").trim();
}

export function nameTokens(value: string): string[] {
  return normalise(value).split(/[\s'-]+/).filter(Boolean);
}

/** Levenshtein distance, giving up once it exceeds `max`. */
function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(previous[j]! + 1, current[j - 1]! + 1, previous[j - 1]! + cost);
      rowMin = Math.min(rowMin, current[j]!);
    }
    if (rowMin > max) return max + 1;
    previous = current;
  }
  return previous[b.length]!;
}

function tokenScore(token: string, word: string): number {
  if (word.startsWith(token)) return token.length === word.length ? 4 : 3;
  if (token.length >= 3 && word.includes(token)) return 2;
  const allowed = token.length >= 6 ? 2 : token.length >= 3 ? 1 : 0;
  if (!allowed) return 0;
  // Compare against the start of the word too, so a typo in a partly typed name still matches.
  const prefix = word.slice(0, token.length);
  return Math.min(editDistance(token, word, allowed), editDistance(token, prefix, allowed)) <= allowed ? 1 : 0;
}

/** 0 when any typed word has no match; otherwise higher is better. */
export function fuzzyNameScore(query: string, name: string): number {
  const tokens = nameTokens(query);
  const words = nameTokens(name);
  if (!tokens.length || !words.length) return 0;
  let total = 0;
  for (const token of tokens) {
    const best = Math.max(...words.map(word => tokenScore(token, word)));
    if (!best) return 0;
    total += best;
  }
  // A match on the first word (usually the first name) ranks a little higher.
  if (words[0]!.startsWith(tokens[0]!)) total += 1;
  return total;
}
