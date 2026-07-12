"use server";

import { revalidatePath } from "next/cache";

import { getAppSession } from "@/lib/app-session";
import {
  markPodcastEpisodeListened,
  markPodcastEpisodesListened,
  removePodcastEpisodeProgress,
} from "@/lib/db/queries/podcast-progress";

export type PodcastProgressActionState = {
  error: string | null;
};

export async function togglePodcastEpisodeProgressAction(
  _previousState: PodcastProgressActionState,
  formData: FormData,
): Promise<PodcastProgressActionState> {
  const session = await getAppSession();

  if (!session) {
    return { error: "You need to be signed in to track podcast progress." };
  }

  const episodeGuid = String(formData.get("episodeGuid") ?? "").trim();
  const wasListened = formData.get("listened") === "true";

  if (!episodeGuid) {
    return { error: "Choose a podcast episode to update." };
  }

  if (wasListened) {
    await removePodcastEpisodeProgress(session.user.id, episodeGuid);
  } else {
    await markPodcastEpisodeListened(session.user.id, episodeGuid);
  }

  revalidatePath("/dashboard/podcast");
  return { error: null };
}

export async function markSelectedPodcastEpisodesListenedAction(
  _previousState: PodcastProgressActionState,
  formData: FormData,
): Promise<PodcastProgressActionState> {
  const session = await getAppSession();

  if (!session) {
    return { error: "You need to be signed in to track podcast progress." };
  }

  const episodeGuids = formData
    .getAll("episodeGuid")
    .map((value) => String(value).trim())
    .filter(Boolean);

  if (!episodeGuids.length) {
    return { error: "Select at least one podcast episode." };
  }

  await markPodcastEpisodesListened(session.user.id, episodeGuids);

  revalidatePath("/dashboard/podcast");
  return { error: null };
}
