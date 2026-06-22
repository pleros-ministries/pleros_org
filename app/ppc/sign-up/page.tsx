import { redirect } from "next/navigation";

type SignUpRedirectPageProps = {
  searchParams: Promise<{
    returnTo?: string;
  }>;
};

export default async function SignUpPage({ searchParams }: SignUpRedirectPageProps) {
  const params = await searchParams;
  const nextQuery = params.returnTo
    ? `?returnTo=${encodeURIComponent(params.returnTo)}`
    : "";

  redirect(`/ppc/signup${nextQuery}`);
}
