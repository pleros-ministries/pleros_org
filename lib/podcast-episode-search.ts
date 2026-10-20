/**
 * Episode search for Teaching's podcast picker (user, 20 October: deduped and
 * done properly). Pure, so the picker filters as you type with no requests.
 *
 * - One row per episode: the feed can repeat a guid, and reposts repeat a
 *   title; the first in release order is kept.
 * - Matching ignores case, accents, punctuation and extra spaces, and every
 *   word typed must appear ("faith part 2" finds "Walk of Faith (Part 2)").
 * - Ranking: the whole phrase at the start of the title, then at a word
 *   start, then anywhere; then every word at a word start; ties keep release
 *   order, so a series stays in sequence.
 */

export type SearchableEpisode = { guid: string; title: string };

/** Lowercase, accents and punctuation removed, single spaces. */
export function normaliseEpisodeText(value: string) {
  return value.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

/** Keeps the first of each guid, then the first of each normalised title. */
export function dedupeEpisodes<T extends SearchableEpisode>(episodes: readonly T[]): T[] {
  const guids = new Set<string>(), titles = new Set<string>();
  return episodes.filter(episode => {
    const guid = episode.guid.trim(), title = normaliseEpisodeText(episode.title);
    if (!guid || guids.has(guid) || (title && titles.has(title))) return false;
    guids.add(guid); if (title) titles.add(title);
    return true;
  });
}

export function searchEpisodes<T extends SearchableEpisode>(episodes: readonly T[], query: string, limit = 30): T[] {
  const phrase = normaliseEpisodeText(query);
  if (!phrase) return [];
  const words = [...new Set(phrase.split(" "))];
  const ranked: Array<{ episode: T; score: number; index: number }> = [];
  episodes.forEach((episode, index) => {
    const title = normaliseEpisodeText(episode.title);
    const padded = ` ${title}`;
    if (!words.every(word => title.includes(word))) return;
    const score = title.startsWith(phrase) ? 0
      : padded.includes(` ${phrase}`) ? 1
      : title.includes(phrase) ? 2
      : words.every(word => padded.includes(` ${word}`)) ? 3
      : 4;
    ranked.push({ episode, score, index });
  });
  return ranked.sort((a, b) => a.score - b.score || a.index - b.index).slice(0, limit).map(row => row.episode);
}
