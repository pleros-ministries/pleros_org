"use server";

import { revalidatePath } from "next/cache";

import { getAppSession } from "@/lib/app-session";
import { upsertSchoolOfPurposeWaitlistEntry } from "@/lib/db/queries/school-of-purpose-waitlist";
import {
  normalizeSchoolOfPurposeWaitlistInput,
  validateSchoolOfPurposeWaitlistInput,
  type SchoolOfPurposeWaitlistFieldErrors,
} from "@/lib/school-of-purpose-waitlist";

export type SchoolOfPurposeWaitlistActionState = {
  values: { name: string; phone: string };
  errors: SchoolOfPurposeWaitlistFieldErrors;
  formError: string | null;
  success: boolean;
};

export const INITIAL_SCHOOL_OF_PURPOSE_WAITLIST_STATE: SchoolOfPurposeWaitlistActionState = {
  values: { name: "", phone: "" },
  errors: {},
  formError: null,
  success: false,
};

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function joinSchoolOfPurposeWaitlistAction(
  _previousState: SchoolOfPurposeWaitlistActionState,
  formData: FormData,
): Promise<SchoolOfPurposeWaitlistActionState> {
  const session = await getAppSession();
  const values = {
    name: readString(formData, "name"),
    phone: readString(formData, "phone"),
  };

  if (!session) {
    return {
      values,
      errors: {},
      formError: "You need to be signed in to join the waitlist.",
      success: false,
    };
  }

  const normalized = normalizeSchoolOfPurposeWaitlistInput(values);
  const errors = validateSchoolOfPurposeWaitlistInput(normalized);

  if (Object.keys(errors).length > 0) {
    return { values: normalized, errors, formError: null, success: false };
  }

  await upsertSchoolOfPurposeWaitlistEntry({
    name: normalized.name,
    phone: normalized.phone,
    email: session.user.email,
  });

  revalidatePath("/dashboard/school-of-purpose");
  return { values: normalized, errors: {}, formError: null, success: true };
}
