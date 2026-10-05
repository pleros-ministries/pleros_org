"use client";

import {
  GROUP_DESCRIPTION_MAX,
  GROUP_NAME_MAX,
  type GroupPrivacy,
} from "@/lib/community/groups";

export type GroupFormValues = {
  name: string;
  description: string;
  privacy: GroupPrivacy;
};

const PRIVACY_OPTIONS: Array<{
  value: GroupPrivacy;
  label: string;
  help: string;
}> = [
  {
    value: "public",
    label: "Public",
    help: "Anyone in the community can read the discussions and join.",
  },
  {
    value: "private",
    label: "Private",
    help: "Anyone can find the group, but only members see its discussions. You approve who joins.",
  },
];

const fieldClass =
  "w-full rounded-xl border border-zinc-200 px-3 text-base font-normal outline-none focus:border-zinc-300";

/** Name, description and privacy fields shared by creating and editing a group. */
export function GroupFormFields({
  values,
  onChange,
}: {
  values: GroupFormValues;
  onChange: (values: GroupFormValues) => void;
}) {
  return (
    <>
      <label className="grid gap-1 text-[13px] font-medium text-zinc-700">
        Group name *
        <input
          value={values.name}
          onChange={(event) => onChange({ ...values, name: event.target.value })}
          maxLength={GROUP_NAME_MAX}
          required
          className={`${fieldClass} h-11`}
        />
      </label>

      <label className="grid gap-1 text-[13px] font-medium text-zinc-700">
        What is it for?
        <textarea
          value={values.description}
          onChange={(event) =>
            onChange({ ...values, description: event.target.value })
          }
          rows={3}
          maxLength={GROUP_DESCRIPTION_MAX}
          className={`${fieldClass} resize-none py-2.5`}
        />
      </label>

      <fieldset className="grid gap-2">
        <legend className="mb-1 text-[13px] font-medium text-zinc-700">
          Who can see it?
        </legend>
        {PRIVACY_OPTIONS.map((option) => (
          <label key={option.value} className="flex items-start gap-2.5">
            <input
              type="radio"
              name="group-privacy"
              value={option.value}
              checked={values.privacy === option.value}
              onChange={() => onChange({ ...values, privacy: option.value })}
              className="mt-1 size-4 accent-[var(--color-brand-blue)]"
            />
            <span className="grid">
              <span className="text-sm font-medium text-zinc-900">
                {option.label}
              </span>
              <span className="text-xs text-zinc-500">{option.help}</span>
            </span>
          </label>
        ))}
      </fieldset>
    </>
  );
}
