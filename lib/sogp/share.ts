/**
 * Builders for sharing a Pre-SOGP preparation "post" to social platforms. The
 * shared link points at the public preview route `/sogp/prepare/<dateKey>` and
 * carries campaign UTM params so an enrolment that follows is attributed to the
 * platform and the day. Kept pure so it can be unit-tested and reused on both
 * server and client.
 */

export const PRE_SOGP_SHARE_PLATFORMS = [
  "whatsapp",
  "facebook",
  "x",
  "telegram",
  "copy",
  "native",
] as const;

export type PreSogpSharePlatform = (typeof PRE_SOGP_SHARE_PLATFORMS)[number];

/** Platforms that open a prefilled web intent (i.e. not copy-link / OS sheet). */
export type PreSogpShareIntentPlatform = Exclude<
  PreSogpSharePlatform,
  "copy" | "native"
>;

export const SOGP_UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

export function buildPreSogpPostPath(
  dateKey: string,
  platform: PreSogpSharePlatform,
): string {
  const params = new URLSearchParams({
    utm_source: platform,
    utm_medium: "share",
    utm_campaign: `pre-sogp-${dateKey}`,
  });
  return `/sogp/prepare/${dateKey}?${params.toString()}`;
}

export function buildPreSogpPostUrl(input: {
  siteUrl: string;
  dateKey: string;
  platform: PreSogpSharePlatform;
}): string {
  return `${input.siteUrl}${buildPreSogpPostPath(input.dateKey, input.platform)}`;
}

export function buildPreSogpShareMessage(input: {
  dayLabel: string;
  title: string;
}): string {
  return [
    `${input.dayLabel} of my Pre-SOGP journey: ${input.title}.`,
    "SOGP is a free four-week journey to find truth and discover God's purpose.",
    "You can join the next cohort free here:",
  ].join(" ");
}

export function buildPreSogpShareIntentUrl(input: {
  platform: PreSogpShareIntentPlatform;
  postUrl: string;
  message: string;
}): string {
  const url = encodeURIComponent(input.postUrl);
  const text = encodeURIComponent(input.message);
  const textWithUrl = encodeURIComponent(`${input.message} ${input.postUrl}`);

  switch (input.platform) {
    case "whatsapp":
      return `https://wa.me/?text=${textWithUrl}`;
    case "facebook":
      // Facebook ignores custom text and reads the page's Open Graph tags.
      return `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    case "x":
      return `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
    case "telegram":
      return `https://t.me/share/url?url=${url}&text=${text}`;
  }
}

/**
 * Picks the five `utm_*` keys out of an incoming query object (mirrors the
 * `/signup` forwarder) so the public preview page can pass them through to
 * `/sogp/enrol`. Returns a query string without a leading `?`.
 */
export function forwardUtmParams(
  input: Record<string, string | string[] | undefined>,
): string {
  const params = new URLSearchParams();
  for (const key of SOGP_UTM_KEYS) {
    const value = input[key];
    if (typeof value === "string" && value.length > 0 && value.length <= 200) {
      params.set(key, value);
    }
  }
  return params.toString();
}
