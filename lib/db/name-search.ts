import "server-only";
import { and, or, sql, type SQL } from "drizzle-orm";
import { nameTokens } from "@/lib/community/fuzzy-name";

/**
 * SQL side of the forgiving name search shared by the church picker, the inbox
 * picker and handover (user report, 19 October: the same name was found on one
 * try and missed on the next). Candidates are narrowed loosely so typos still
 * reach the fuzzy ranker, but rows where every typed word appears are ordered
 * first, so a capped candidate list can never drop a real match at random.
 */
export function nameSearch(term: string, haystack: SQL) {
  const tokens = nameTokens(term);
  if (!tokens.length) return null;
  const escape = (value: string) => value.replace(/[\\%_]/g, "\\$&");
  const strict = and(...tokens.map(token => sql`${haystack} ilike ${`%${escape(token)}%`}`))!;
  const loose = or(...tokens.map(token => sql`${haystack} ilike ${`%${escape(token.slice(0, token.length >= 4 ? 3 : 2))}%`}`))!;
  return { tokens, loose, rank: sql`case when ${strict} then 0 else 1 end` };
}

/** The fullest of several stored names (an account name is sometimes only a first name). */
export function fullestName(...names: Array<string | null | undefined>): string {
  let best = "";
  for (const raw of names) {
    const name = raw?.trim().replace(/\s+/g, " ") ?? "";
    if (!name || name.includes("@")) continue;
    if (name.split(" ").length > best.split(" ").filter(Boolean).length || (name.split(" ").length === best.split(" ").length && name.length > best.length)) best = name;
  }
  return best;
}
