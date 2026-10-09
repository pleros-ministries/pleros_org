import { after } from "next/server";

import { checkAndAwardSogpWeekCertificates } from "@/lib/db/queries/sogp-week-certificates";

/**
 * After a learner (or staff correcting their record) marks something
 * complete, check whether a SOGP week is now finished and award its
 * certificate. Runs after the response so it never slows or fails the write;
 * call it only once the write has succeeded.
 */
export function scheduleSogpWeekCertificateCheck(userId: string) {
  after(() =>
    checkAndAwardSogpWeekCertificates(userId).catch((error) => {
      console.error("SOGP week certificate check failed:", error);
    }),
  );
}
