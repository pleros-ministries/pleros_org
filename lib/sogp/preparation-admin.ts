import type { SogpPreparationResourceType } from "./types";

const RESOURCE_TYPES = new Set<SogpPreparationResourceType>([
  "teaching",
  "podcast",
  "video",
  "reading",
  "gift",
  "announcement",
]);
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type SogpPreparationResourceInput = {
  type: SogpPreparationResourceType;
  title: string;
  description?: string | null;
  url: string;
};

export type SogpPreparationInput = {
  id?: number;
  cohortId: number;
  publishDate: string;
  countdownLabel: string;
  introduction: string;
  resources: SogpPreparationResourceInput[];
};

function clean(value: string | null | undefined, maxLength: number) {
  return value?.trim().slice(0, maxLength) ?? "";
}

function isSafeResourceUrl(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeSogpPreparationInput(input: SogpPreparationInput) {
  if (!Number.isInteger(input.cohortId) || input.cohortId <= 0) {
    throw new Error("Choose a valid cohort.");
  }
  if (!DATE_PATTERN.test(input.publishDate)) {
    throw new Error("Choose a valid publication date.");
  }
  const countdownLabel = clean(input.countdownLabel, 120);
  const introduction = clean(input.introduction, 2_000);
  if (!countdownLabel) throw new Error("Add a countdown label.");
  if (!introduction) throw new Error("Add the preparation introduction.");
  if (!input.resources.length) {
    throw new Error("Add at least one preparation resource.");
  }

  const resources = input.resources.map((resource, sortOrder) => {
    const title = clean(resource.title, 180);
    const description = clean(resource.description, 500);
    const url = clean(resource.url, 2_000);
    if (!RESOURCE_TYPES.has(resource.type)) {
      throw new Error("Choose a valid resource type.");
    }
    if (!title) throw new Error("Every resource needs a title.");
    if (!isSafeResourceUrl(url)) {
      throw new Error("Use an internal path or secure HTTPS resource link.");
    }
    return {
      type: resource.type,
      title,
      description: description || null,
      url,
      sortOrder,
    };
  });

  return {
    id: input.id,
    cohortId: input.cohortId,
    publishDate: input.publishDate,
    countdownLabel,
    introduction,
    resources,
  };
}
