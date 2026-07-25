import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { hashSuperAdminSetupToken } from "@/lib/super-admin-setup";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function revokePendingSuperAdminSetupClaims(email: string) {
  await db
    .update(schema.superAdminSetupClaims)
    .set({
      consumedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.superAdminSetupClaims.email, normalizeEmail(email)),
        isNull(schema.superAdminSetupClaims.consumedAt),
      ),
    );
}

export async function createSuperAdminSetupClaim(data: {
  email: string;
  name: string;
  tokenHash: string;
  expiresAt: Date;
}) {
  const [claim] = await db
    .insert(schema.superAdminSetupClaims)
    .values({
      email: normalizeEmail(data.email),
      name: data.name.trim(),
      tokenHash: data.tokenHash,
      expiresAt: data.expiresAt,
    })
    .returning();

  return claim;
}

export async function getSuperAdminSetupClaimByToken(token: string) {
  const tokenHash = hashSuperAdminSetupToken(token);

  return (
    (await db.query.superAdminSetupClaims.findFirst({
      where: (claim, { eq: eq2 }) => eq2(claim.tokenHash, tokenHash),
    })) ?? null
  );
}

export async function consumeSuperAdminSetupClaim(claimId: number) {
  const [claim] = await db
    .update(schema.superAdminSetupClaims)
    .set({
      consumedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.superAdminSetupClaims.id, claimId))
    .returning();

  return claim;
}
