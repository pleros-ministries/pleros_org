"use server";

import { revalidatePath } from "next/cache";

import { getAppSession } from "@/lib/app-session";
import { upsertSchoolOfPurposeWaitlistEntry } from "@/lib/db/queries/school-of-purpose-waitlist";
import {
  normalizeSchoolOfPurposeWaitlistInput,
  validateSchoolOfPurposeWaitlistInput,
  type SchoolOfPurposeWaitlistActionState,
} from "@/lib/school-of-purpose-waitlist";

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
