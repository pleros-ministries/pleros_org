"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createCommunityGroup } from "@/app/(site)/dashboard/community/_actions/group-actions";

import { GroupFormFields, type GroupFormValues } from "./group-form";

const EMPTY: GroupFormValues = { name: "", description: "", privacy: "public" };

/** Start a new group; on success the creator lands in it as its owner. */
export function CreateGroupDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [values, setValues] = useState<GroupFormValues>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await createCommunityGroup(values);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        router.push(`/dashboard/community/groups/${result.id}`);
      } catch {
        setError("Could not create the group. Try again.");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setValues(EMPTY);
          setError(null);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="site-font-theme">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Create a group</DialogTitle>
          <DialogDescription className="text-sm">
            You will be its owner: you can approve members, choose moderators
            and close it at any time.
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <GroupFormFields values={values} onChange={setValues} />

          {error ? (
            <p role="alert" className="text-[13px] text-red-700">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Creating…" : "Create group"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
