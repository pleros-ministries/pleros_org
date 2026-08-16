"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  INITIAL_FIRST_TIME_WORSHIPPER_SUBMIT_STATE,
  normalizeFirstTimeWorshipperInput,
  validateFirstTimeWorshipperInput,
  type FirstTimeWorshipperSubmitState,
} from "@/lib/first-time-worshippers";
import { appendFirstTimeWorshipper } from "@/lib/first-time-worshippers-sheet";
import {
  readWelcomeAccessToken,
  WELCOME_ACCESS_COOKIE_NAME,
} from "@/lib/welcome-access";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function submitFirstTimeWorshipperAction(
  _previousState: FirstTimeWorshipperSubmitState,
  formData: FormData,
): Promise<FirstTimeWorshipperSubmitState> {
  const cookieStore = await cookies();
  const welcomeAccess = readWelcomeAccessToken(
    cookieStore.get(WELCOME_ACCESS_COOKIE_NAME)?.value,
    process.env,
  );
  const values = normalizeFirstTimeWorshipperInput({
    fullName: readString(formData, "fullName"),
    phone: readString(formData, "phone"),
    whatsappNumber: readString(formData, "whatsappNumber"),
    email: readString(formData, "email") || welcomeAccess?.email || "",
    homeAddress: readString(formData, "homeAddress"),
    location: readString(formData, "location"),
  });
  const errors = validateFirstTimeWorshipperInput(values);

  if (Object.keys(errors).length > 0) {
    return { values, errors, formError: null };
  }

  if (readString(formData, "website")) {
    redirect("/fft?submitted=1");
  }

  try {
    await appendFirstTimeWorshipper(values);
  } catch (error) {
    console.error("First-time worshipper sheet submission failed:", error);
    return {
      ...INITIAL_FIRST_TIME_WORSHIPPER_SUBMIT_STATE,
      values,
      formError:
        "We couldn't send your details right now. Please try again in a moment.",
    };
  }

  redirect("/fft?submitted=1");
}
