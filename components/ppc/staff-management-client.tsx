"use client";

import { useEffect, useState, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MailPlus, RotateCcw, SearchIcon, ShieldCheck, UserPlus, XCircle } from "lucide-react";

import {
  createStaffInviteAction,
  grantExistingUserStaffRole,
  removeStaffRole,
  revokeStaffInviteAction,
  searchStaffCandidatesAction,
} from "@/app/ppc/_actions/staff-invite-actions";
import { StatusBadge } from "@/components/ppc/status-badge";
import { getAppRoleLabel } from "@/lib/app-role";
import { cn } from "@/lib/utils";
import { ADMIN_QUERY_KEYS } from "@/lib/admin-query";

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

type StaffCandidate = {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
};

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
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "instructor" | "pastor">("admin");
  const [feedback, setFeedback] = useState<{
    tone: "default" | "error";
    message: string;
    inviteUrl?: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const [grantQuery, setGrantQuery] = useState("");
  const [grantCandidates, setGrantCandidates] = useState<StaffCandidate[]>([]);
  const [grantSearching, setGrantSearching] = useState(false);
  const [grantSelected, setGrantSelected] = useState<StaffCandidate | null>(null);
  const [grantRole, setGrantRole] = useState<"admin" | "instructor" | "pastor">(
    "pastor",
  );
  const [grantFeedback, setGrantFeedback] = useState<{
    tone: "default" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (grantSelected || !grantQuery.trim()) {
      setGrantCandidates([]);
      return;
    }

    let cancelled = false;
    setGrantSearching(true);
    const timer = window.setTimeout(async () => {
      try {
        const results = await searchStaffCandidatesAction(grantQuery);
        if (!cancelled) setGrantCandidates(results);
      } catch {
        if (!cancelled) setGrantCandidates([]);
      } finally {
        if (!cancelled) setGrantSearching(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [grantQuery, grantSelected]);

  const handleCreateInvite = (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      try {
        const invite = await createStaffInviteAction({ email, role });
        if (invite.error || !invite.email) {
          setFeedback({
            tone: "error",
            message: invite.error ?? "Invite could not be created.",
          });
          return;
        }
        await queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.staff });
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
        await queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.staff });
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

  const handleSelectCandidate = (candidate: StaffCandidate) => {
    setGrantSelected(candidate);
    setGrantQuery(`${candidate.name} <${candidate.email}>`);
    setGrantCandidates([]);
  };

  const handleClearCandidate = () => {
    setGrantSelected(null);
    setGrantQuery("");
    setGrantCandidates([]);
  };

  const handleGrantExisting = (event: React.FormEvent) => {
    event.preventDefault();
    setGrantFeedback(null);

    if (!grantSelected) {
      setGrantFeedback({ tone: "error", message: "Search and select an account first." });
      return;
    }

    startTransition(async () => {
      try {
        const result = await grantExistingUserStaffRole({
          userId: grantSelected.id,
          role: grantRole,
        });
        if (result.error) {
          setGrantFeedback({ tone: "error", message: result.error });
          return;
        }
        await queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.staff });
        handleClearCandidate();
        setGrantFeedback({
          tone: "default",
          message: result.emailVerified
            ? `Access granted. They can log in now — an email was sent.`
            : `Access granted, but this account hasn't verified its email yet — it won't take effect until they do.`,
        });
      } catch (error) {
        setGrantFeedback({
          tone: "error",
          message:
            error instanceof Error ? error.message : "Could not grant access.",
        });
      }
    });
  };

  const handleRemoveRole = (userId: string) => {
    setFeedback(null);

    startTransition(async () => {
      try {
        await removeStaffRole({ userId });
        await queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.staff });
        setFeedback({
          tone: "default",
          message: "Pastor access removed.",
        });
      } catch (error) {
        setFeedback({
          tone: "error",
          message:
            error instanceof Error ? error.message : "Could not remove access.",
        });
      }
    });
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
      <div className="grid gap-4">
        <section className="max-w-md rounded-sm border border-zinc-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <MailPlus className="size-4 text-zinc-500" />
          <h3 className="ppc-heading text-sm font-semibold text-zinc-900">
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
                setRole(event.target.value as "admin" | "instructor" | "pastor")
              }
              className="h-8 rounded-sm border border-zinc-300 bg-white px-2.5 text-xs outline-none focus:border-zinc-700"
            >
              <option value="admin">Admin</option>
              <option value="instructor">Instructor</option>
              <option value="pastor">Pastor</option>
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
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-sm bg-[var(--color-brand-blue)] px-3 text-xs font-semibold text-white hover:bg-[var(--color-brand-blue-hover)] disabled:opacity-50"
          >
            <MailPlus className="size-3.5" />
            {isPending ? "Creating..." : "Send invite"}
          </button>
        </form>
      </section>

      <section className="max-w-md rounded-sm border border-zinc-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <UserPlus className="size-4 text-zinc-500" />
          <h3 className="ppc-heading text-sm font-semibold text-zinc-900">
            Grant access to an existing account
          </h3>
        </div>
        <p className="mt-1 text-[11px] text-zinc-500">
          For someone who already has an account (e.g. registered for SOGP) —
          skips the invite email and sets their role directly.
        </p>

        <form onSubmit={handleGrantExisting} className="mt-4 grid gap-3">
          <label className="grid gap-1">
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500">
              Name or email
            </span>
            {grantSelected ? (
              <div className="flex items-center justify-between gap-2 rounded-sm border border-zinc-300 bg-zinc-50 px-2.5 py-1.5 text-xs">
                <div className="min-w-0">
                  <p className="truncate font-medium text-zinc-900">
                    {grantSelected.name}
                  </p>
                  <p className="truncate text-[11px] text-zinc-500">
                    {grantSelected.email} · currently {getAppRoleLabel(grantSelected.role)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClearCandidate}
                  className="shrink-0 text-[11px] font-medium text-zinc-500 underline hover:text-zinc-800"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={grantQuery}
                  onChange={(event) => setGrantQuery(event.target.value)}
                  placeholder="Search by name or email…"
                  className="h-8 w-full rounded-sm border border-zinc-300 pl-8 pr-2.5 text-xs outline-none focus:border-zinc-700"
                />
                {grantQuery.trim() ? (
                  <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-sm border border-zinc-200 bg-white shadow-sm">
                    {grantSearching ? (
                      <p className="px-3 py-2 text-[11px] text-zinc-400">Searching…</p>
                    ) : grantCandidates.length === 0 ? (
                      <p className="px-3 py-2 text-[11px] text-zinc-400">
                        No matching accounts. Make sure they&apos;ve already signed up.
                      </p>
                    ) : (
                      grantCandidates.map((candidate) => (
                        <button
                          key={candidate.id}
                          type="button"
                          onClick={() => handleSelectCandidate(candidate)}
                          className="flex w-full flex-col items-start gap-0.5 border-b border-zinc-100 px-3 py-2 text-left last:border-b-0 hover:bg-zinc-50"
                        >
                          <span className="text-xs font-medium text-zinc-900">
                            {candidate.name}
                          </span>
                          <span className="text-[11px] text-zinc-500">
                            {candidate.email} · currently {getAppRoleLabel(candidate.role)}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </label>

          <label className="grid gap-1">
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500">
              Role
            </span>
            <select
              value={grantRole}
              onChange={(event) =>
                setGrantRole(event.target.value as "admin" | "instructor" | "pastor")
              }
              className="h-8 rounded-sm border border-zinc-300 bg-white px-2.5 text-xs outline-none focus:border-zinc-700"
            >
              <option value="admin">Admin</option>
              <option value="instructor">Instructor</option>
              <option value="pastor">Pastor</option>
            </select>
          </label>

          {grantFeedback ? (
            <div
              className={cn(
                "rounded-sm border px-3 py-2 text-xs",
                grantFeedback.tone === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-zinc-200 bg-zinc-50 text-zinc-600",
              )}
            >
              <p>{grantFeedback.message}</p>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-sm bg-[var(--color-brand-blue)] px-3 text-xs font-semibold text-white hover:bg-[var(--color-brand-blue-hover)] disabled:opacity-50"
          >
            <UserPlus className="size-3.5" />
            {isPending ? "Granting..." : "Grant access"}
          </button>
        </form>
      </section>
      </div>

      <div className="grid gap-4">
        <section className="rounded-sm border border-zinc-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-zinc-500" />
            <h3 className="ppc-heading text-sm font-semibold text-zinc-900">
              Current staff
            </h3>
          </div>

          <div className="mt-3 overflow-hidden rounded-sm border border-zinc-100">
            {staffUsers.length ? (
              staffUsers.map((user) => (
                <div
                  key={user.id}
                  className="grid gap-2 border-b border-zinc-100 px-3 py-2 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_120px_110px_auto]"
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
                    <StatusBadge status={getAppRoleLabel(user.role)} />
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    {formatDate(user.createdAt)}
                  </p>
                  <div className="flex items-center justify-end">
                    {user.role === "pastor" ? (
                      <button
                        type="button"
                        onClick={() => handleRemoveRole(user.id)}
                        disabled={isPending}
                        title="Remove pastor access"
                        className="inline-flex h-7 items-center gap-1 rounded-sm border border-zinc-200 px-2 text-[11px] font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
                      >
                        <XCircle className="size-3.5" />
                        Remove pastor access
                      </button>
                    ) : null}
                  </div>
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
            <h3 className="ppc-heading text-sm font-semibold text-zinc-900">
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
                  <StatusBadge status={getAppRoleLabel(invite.role)} />
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
