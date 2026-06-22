"use client";

import { useState, useTransition } from "react";
import { MailPlus, RotateCcw, ShieldCheck, XCircle } from "lucide-react";

import {
  createStaffInviteAction,
  revokeStaffInviteAction,
} from "@/app/ppc/_actions/staff-invite-actions";
import { StatusBadge } from "@/components/ppc/status-badge";
import { cn } from "@/lib/utils";

type StaffUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

type StaffInvite = {
  id: number;
  email: string;
  role: string;
  invitedByName: string | null;
  status: "pending" | "accepted" | "revoked" | "expired";
  expiresAt: string;
  createdAt: string;
};

type StaffManagementClientProps = {
  staffUsers: StaffUser[];
  invites: StaffInvite[];
};

function roleLabel(role: string) {
  if (role === "super_admin") {
    return "Super admin";
  }

  return role;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function inviteStatusVariant(status: StaffInvite["status"]) {
  if (status === "accepted") {
    return "success" as const;
  }

  if (status === "pending") {
    return "warning" as const;
  }

  return "default" as const;
}

export function StaffManagementClient({
  staffUsers,
  invites,
}: StaffManagementClientProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "instructor">("admin");
  const [feedback, setFeedback] = useState<{
    tone: "default" | "error";
    message: string;
    inviteUrl?: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCreateInvite = (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      try {
        const invite = await createStaffInviteAction({ email, role });
        setEmail("");
        setRole("admin");
        setFeedback({
          tone: "default",
          message: invite.emailSent
            ? `Invite sent to ${invite.email}.`
            : `Invite created for ${invite.email}. Email delivery is not configured, so use the setup link below.`,
          inviteUrl: invite.emailSent ? undefined : invite.inviteUrl,
        });
      } catch (error) {
        setFeedback({
          tone: "error",
          message:
            error instanceof Error ? error.message : "Invite could not be created.",
        });
      }
    });
  };

  const handleRevokeInvite = (inviteId: number) => {
    setFeedback(null);

    startTransition(async () => {
      try {
        await revokeStaffInviteAction(inviteId);
        setFeedback({
          tone: "default",
          message: "Invite revoked.",
        });
      } catch (error) {
        setFeedback({
          tone: "error",
          message:
            error instanceof Error ? error.message : "Invite could not be revoked.",
        });
      }
    });
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
      <section className="rounded-sm border border-zinc-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <MailPlus className="size-4 text-zinc-500" />
          <h3 className="text-sm font-semibold text-zinc-900">
            Invite staff
          </h3>
        </div>

        <form onSubmit={handleCreateInvite} className="mt-4 grid gap-3">
          <label className="grid gap-1">
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500">
              Email
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@example.com"
              className="h-8 rounded-sm border border-zinc-300 px-2.5 text-xs outline-none focus:border-zinc-700"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500">
              Role
            </span>
            <select
              value={role}
              onChange={(event) =>
                setRole(event.target.value as "admin" | "instructor")
              }
              className="h-8 rounded-sm border border-zinc-300 bg-white px-2.5 text-xs outline-none focus:border-zinc-700"
            >
              <option value="admin">Admin</option>
              <option value="instructor">Instructor</option>
            </select>
          </label>

          {feedback ? (
            <div
              className={cn(
                "rounded-sm border px-3 py-2 text-xs",
                feedback.tone === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-zinc-200 bg-zinc-50 text-zinc-600",
              )}
            >
              <p>{feedback.message}</p>
              {feedback.inviteUrl ? (
                <p className="mt-2 break-all font-mono text-[10px] text-zinc-500">
                  {feedback.inviteUrl}
                </p>
              ) : null}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-sm bg-zinc-900 px-3 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            <MailPlus className="size-3.5" />
            {isPending ? "Creating..." : "Send invite"}
          </button>
        </form>
      </section>

      <div className="grid gap-4">
        <section className="rounded-sm border border-zinc-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-zinc-500" />
            <h3 className="text-sm font-semibold text-zinc-900">
              Current staff
            </h3>
          </div>

          <div className="mt-3 overflow-hidden rounded-sm border border-zinc-100">
            {staffUsers.length ? (
              staffUsers.map((user) => (
                <div
                  key={user.id}
                  className="grid gap-2 border-b border-zinc-100 px-3 py-2 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_120px_110px]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-zinc-900">
                      {user.name}
                    </p>
                    <p className="truncate text-[11px] text-zinc-500">
                      {user.email}
                    </p>
                  </div>
                  <div>
                    <StatusBadge status={roleLabel(user.role)} />
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    {formatDate(user.createdAt)}
                  </p>
                </div>
              ))
            ) : (
              <p className="px-3 py-8 text-center text-xs text-zinc-400">
                No staff accounts yet.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-sm border border-zinc-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <RotateCcw className="size-4 text-zinc-500" />
            <h3 className="text-sm font-semibold text-zinc-900">
              Invites
            </h3>
          </div>

          <div className="mt-3 overflow-hidden rounded-sm border border-zinc-100">
            {invites.length ? (
              invites.map((invite) => (
                <div
                  key={invite.id}
                  className="grid gap-2 border-b border-zinc-100 px-3 py-2 last:border-b-0 md:grid-cols-[minmax(0,1fr)_100px_100px_120px]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-zinc-900">
                      {invite.email}
                    </p>
                    <p className="truncate text-[11px] text-zinc-500">
                      Invited by {invite.invitedByName ?? "staff"}
                    </p>
                  </div>
                  <StatusBadge status={roleLabel(invite.role)} />
                  <StatusBadge
                    status={invite.status}
                    variant={inviteStatusVariant(invite.status)}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] text-zinc-400">
                      {formatDate(invite.expiresAt)}
                    </p>
                    {invite.status === "pending" ? (
                      <button
                        type="button"
                        onClick={() => handleRevokeInvite(invite.id)}
                        disabled={isPending}
                        title="Revoke invite"
                        className="inline-flex size-7 items-center justify-center rounded-sm border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-50"
                      >
                        <XCircle className="size-3.5" />
                      </button>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <p className="px-3 py-8 text-center text-xs text-zinc-400">
                No invites yet.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

