import "server-only";

import { getCommunityHomeDiscipleship } from "./community-discipleship";
import { listLedGroupInvites } from "./led-discipleship-invites";

/** The viewer's open discipleship groups for an invite picker: link, size and card colourway. */
export async function listInviteGroups(userId: string) {
  const [groups, discipleship] = await Promise.all([listLedGroupInvites(userId), getCommunityHomeDiscipleship(userId).catch(() => null)]);
  const open = (discipleship?.leading ?? []).filter(group => !group.paused);
  return groups.map(group => {
    const index = open.findIndex(item => item.groupId === group.id);
    return {
      ...group,
      discipleCount: open[index]?.discipleCount ?? 0,
      colourway: (index % 2 === 1 ? "slate" : "lilac") as "lilac" | "slate",
    };
  });
}
