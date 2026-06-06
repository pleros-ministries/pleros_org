export const SERIES_EMOJI: Record<string, string> = {
  "Faith & Growth": "",
  "Gospel & Truth": "",
  "The New Creation": "",
  "Prayer & Devotion": "",
  "Purpose": "",
  "Redemption": "",
  "The Church & Supernatural": "",
};

export function getSeriesEmoji(series: string): string {
  return SERIES_EMOJI[series] ?? "";
}
