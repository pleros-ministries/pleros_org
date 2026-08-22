import { and, desc, eq, isNull } from "drizzle-orm";

import type { StaffInviteRole } from "@/lib/app-role";
import { db } from "@/lib/db";
import * as authSchema from "@/lib/db/auth-schema";
import * as schema from "@/lib/db/schema";
import { getStaffInviteStatus, hashStaffInviteToken } from "@/lib/staff-invites";

export async function createStaffInvite(data: {
  email: string;
  role: StaffInviteRole;
  tokenHash: string;
  invitedBy: string;
  expiresAt: Date;
}) {
  const [invite] = await db
    .insert(schema.staffInvites)
    .values({
      email: data.email.trim().toLowerCase(),
      role: data.role,
      tokenHash: data.tokenHash,
      invitedBy: data.invitedBy,
      expiresAt: data.expiresAt,
    })
    .returning();

  return invite;
}

export async function getStaffInviteByToken(token: string) {
  const tokenHash = hashStaffInviteToken(token);

  return (
    (await db.query.staffInvites.findFirst({
      where: (invite, { eq: eq2 }) => eq2(invite.tokenHash, tokenHash),
    })) ?? null
  );
}

export async function acceptStaffInvite(inviteId: number, acceptedBy: string) {
  const [invite] = await db
    .update(schema.staffInvites)
    .set({
      acceptedBy,
      acceptedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.staffInvites.id, inviteId))
    .returning();

  return invite;
}

export async function revokeStaffInvite(inviteId: number) {
  const [invite] = await db
    .update(schema.staffInvites)
    .set({
      revokedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.staffInvites.id, inviteId))
    .returning();

  return invite;
}

export async function getAuthUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(authSchema.user)
    .where(eq(authSchema.user.email, email.trim().toLowerCase()))
    .limit(1);

  return user ?? null;
}

export async function listStaffUsers() {
  return db.query.users.findMany({
    where: (user, { inArray }) =>
      inArray(user.role, ["super_admin", "admin", "instructor"]),
    orderBy: (user, { asc }) => [asc(user.role), asc(user.email)],
  });
}

export async function listStaffInvites() {
  const invites = await db
    .select({
      id: schema.staffInvites.id,
      email: schema.staffInvites.email,
      role: schema.staffInvites.role,
      invitedBy: schema.staffInvites.invitedBy,
      invitedByName: schema.users.name,
      acceptedAt: schema.staffInvites.acceptedAt,
      revokedAt: schema.staffInvites.revokedAt,
      expiresAt: schema.staffInvites.expiresAt,
      createdAt: schema.staffInvites.createdAt,
    })
    .from(schema.staffInvites)
    .leftJoin(schema.users, eq(schema.staffInvites.invitedBy, schema.users.id))
    .orderBy(desc(schema.staffInvites.createdAt));

  return invites.map((invite) => ({
    ...invite,
    status: getStaffInviteStatus(invite),
  }));
}

export async function findPendingStaffInviteByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  const [invite] = await db
    .select()
    .from(schema.staffInvites)
    .where(
      and(
        eq(schema.staffInvites.email, normalizedEmail),
        isNull(schema.staffInvites.acceptedAt),
        isNull(schema.staffInvites.revokedAt),
      ),
    )
    .orderBy(desc(schema.staffInvites.createdAt))
    .limit(1);

  return invite ?? null;
}

export async function getAuthAccountForUser(userId: string) {
  const [account] = await db
    .select()
    .from(authSchema.account)
    .where(eq(authSchema.account.userId, userId))
    .limit(1);

  return account ?? null;
}
