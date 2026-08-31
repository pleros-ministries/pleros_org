import { redirect } from "next/navigation";

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const input = await searchParams;
  const params = new URLSearchParams();
  for (const key of UTM_KEYS) {
    const value = input[key];
    if (typeof value === "string" && value.length <= 200) params.set(key, value);
  }
  const query = params.toString();
  redirect(`/sogp/enrol${query ? `?${query}` : ""}`);
}
