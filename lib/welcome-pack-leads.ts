import { normalizeEmail } from "./welcome-flow";

export type WelcomePackLeadInput = {
  email: string;
  name?: string | null;
  source?: string | null;
};

export type WelcomePackLeadAccess = {
  mainAccessGranted: boolean;
  extraGiftsUnlocked: boolean;
};

export type WelcomePackLeadSummary = {
  id: number;
  email: string;
  name: string | null;
  source: string;
  mainAccessGranted: boolean;
  extraGiftsUnlocked: boolean;
  sharedConfirmedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type SerializedWelcomePackLeadSummary = Omit<
  WelcomePackLeadSummary,
  "sharedConfirmedAt" | "createdAt" | "updatedAt"
> & {
  sharedConfirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export function buildWelcomeLeadUpsertValues(input: WelcomePackLeadInput) {
  const name = input.name?.trim() || null;
  const source = input.source?.trim() || "welcome";

  return {
    email: normalizeEmail(input.email),
    name,
    source,
    mainAccessGranted: true,
    extraGiftsUnlocked: false,
    sharedConfirmedAt: null,
  };
}

export function resolveWelcomePackAccessState(
  lead: WelcomePackLeadAccess | null,
) {
  return {
    mainGiftsAccessible: lead?.mainAccessGranted ?? true,
    extraGiftsUnlocked: lead?.extraGiftsUnlocked ?? false,
  };
}

export function serializeWelcomeLeadSummary(
  lead: WelcomePackLeadSummary,
): SerializedWelcomePackLeadSummary {
  return {
    ...lead,
    sharedConfirmedAt: lead.sharedConfirmedAt?.toISOString() ?? null,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
  };
}
