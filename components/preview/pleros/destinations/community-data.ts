import type { CommunityTopicKey } from "@/lib/community/topics";

/**
 * Synthetic community content for the demo. Authors are demo people ids (or
 * the ministry itself); every edit stays in React state in this tab.
 */

export const PLEROS_AUTHOR = "pleros";

export type DemoComment = { id: number; authorId: string; body: string; minutesAgo: number };

export type DemoPost = {
  id: number;
  authorId: string;
  kind: "official" | "discussion";
  /** `global` for community-wide, `unit` for a location group, `group:<id>` or `discipleship:<id>` for private spaces. */
  scope: string;
  topic: CommunityTopicKey | null;
  title: string;
  body: string;
  likes: string[];
  comments: DemoComment[];
  minutesAgo: number;
  pinned?: boolean;
};

export function initialPosts(): DemoPost[] {
  return [
    {
      id: 1,
      authorId: PLEROS_AUTHOR,
      kind: "official",
      scope: "global",
      topic: null,
      title: "This week's Sunday review",
      body: "The Level 3 review holds on Sunday at 4 pm. Bring one question from this week's teachings.",
      likes: ["w-sade", "d-grace", "u-femi", "w-bisi"],
      comments: [{ id: 101, authorId: "d-grace", body: "I'll be there. Thank you!", minutesAgo: 140 }],
      minutesAgo: 180,
      pinned: true,
    },
    {
      id: 2,
      authorId: "w-sade",
      kind: "discussion",
      scope: "global",
      topic: "testimony",
      title: "Prayer Watch changed my mornings",
      body: "Two weeks of 5:30 am Prayer Watch and I'm reading more and worrying less. Anyone else noticing this?",
      likes: ["w-tolu", "d-blessing", "w-emeka"],
      comments: [
        { id: 201, authorId: "w-emeka", body: "Same here. The first week was the hardest.", minutesAgo: 50 },
        { id: 202, authorId: "d-blessing", body: "Praise God!", minutesAgo: 20 },
      ],
      minutesAgo: 95,
    },
    {
      id: 3,
      authorId: "d-musa",
      kind: "discussion",
      scope: "global",
      topic: "question",
      title: "How do you keep up with the written responses?",
      body: "I listen on my commute but struggle to write afterwards. What works for you?",
      likes: [],
      comments: [],
      minutesAgo: 400,
    },
    {
      id: 4,
      authorId: "w-emeka",
      kind: "discussion",
      scope: "unit",
      topic: "bible_study",
      title: "Reading John together this month",
      body: "A few of us are reading a chapter of John each day. Join in and share what stands out.",
      likes: ["w-tolu"],
      comments: [{ id: 401, authorId: "w-sade", body: "Count me in from tomorrow.", minutesAgo: 30 }],
      minutesAgo: 60,
    },
    {
      id: 5,
      authorId: "u-chioma",
      kind: "official",
      scope: "unit",
      topic: null,
      title: "Saturday outreach meeting point",
      body: "We meet at 9 am by the Yaba bus stop. Wear something comfortable.",
      likes: ["w-sade", "w-emeka"],
      comments: [],
      minutesAgo: 1440,
    },
    {
      id: 6,
      authorId: "d-kemi",
      kind: "discussion",
      scope: "global",
      topic: "prayer",
      title: "Please pray for my exams",
      body: "Final exams start on Monday. I'd appreciate your prayers for focus and calm.",
      likes: ["w-sade", "p-ngozi"],
      comments: [],
      minutesAgo: 1600,
    },
  ];
}

export type DemoMemberGroup = {
  id: number;
  name: string;
  description: string;
  privacy: "public" | "private";
  ownerId: string;
  memberIds: string[];
};

export const MEMBER_GROUPS_OWNED_MAX = 3;

export function initialMemberGroups(): DemoMemberGroup[] {
  return [
    { id: 1, name: "Young professionals", description: "Faith at work, careers and purpose.", privacy: "public", ownerId: "w-sade", memberIds: ["w-sade", "w-tolu", "w-dayo", "d-kemi"] },
    { id: 2, name: "Mothers in prayer", description: "A quiet space to pray for our families.", privacy: "private", ownerId: "w-halima", memberIds: ["w-halima", "u-amina"] },
    { id: 3, name: "Worship musicians", description: "Songs, rehearsals and serving together.", privacy: "public", ownerId: "w-emeka", memberIds: ["w-emeka", "d-samuel"] },
    { id: 4, name: "Abuja Bible readers", description: "One chapter a day, shared every evening.", privacy: "private", ownerId: "w-joseph", memberIds: ["w-joseph", "d-musa", "w-halima"] },
  ];
}

export function initialGroupPosts(): DemoPost[] {
  return [
    { id: 301, authorId: "w-sade", kind: "discussion", scope: "group:1", topic: "general", title: "Lunch-break reading plan", body: "Ten minutes of reading at lunch: who's in?", likes: ["w-dayo"], comments: [], minutesAgo: 240 },
    { id: 302, authorId: "w-emeka", kind: "discussion", scope: "group:3", topic: "general", title: "Rehearsal on Friday", body: "We'll practise the new song at 6 pm.", likes: [], comments: [], minutesAgo: 600 },
    { id: 303, authorId: "w-joseph", kind: "discussion", scope: "group:4", topic: "bible_study", title: "Romans 8 tonight", body: "Share one verse that stood out to you.", likes: ["d-musa"], comments: [], minutesAgo: 90 },
    { id: 304, authorId: "w-halima", kind: "discussion", scope: "group:2", topic: "prayer", title: "Monday prayer list", body: "Add your family's needs below.", likes: [], comments: [], minutesAgo: 1300 },
  ];
}

export type DemoMessage = { id: number; fromId: string; body: string; minutesAgo: number };
export type DemoThread = { id: number; peerId: string; messages: DemoMessage[]; unread: boolean };

/** Threads are keyed by peer; the viewer is whoever is signed in to the demo. */
export function initialThreads(viewerId: string): DemoThread[] {
  const peers = ["w-sade", "u-chioma", "d-grace"].filter((id) => id !== viewerId);
  const scripts: Record<string, string[]> = {
    "w-sade": ["Are you coming to the outreach on Saturday?", "Yes! I'll bring two friends.", "Wonderful, see you there."],
    "u-chioma": ["Thanks for sending your report on time this week.", "Thank you, ma."],
    "d-grace": ["I finished the Walk of Faith teaching. It really helped.", "So glad to hear that, Grace!"],
  };
  return peers.map((peerId, index) => ({
    id: index + 1,
    peerId,
    unread: index === 0,
    messages: (scripts[peerId] ?? []).map((body, line) => ({
      id: index * 10 + line,
      fromId: line % 2 === 0 ? peerId : viewerId,
      body,
      minutesAgo: (index + 1) * 120 - line * 15,
    })),
  }));
}

export type DemoQuestion = {
  id: number;
  body: string;
  anonymous: boolean;
  minutesAgo: number;
  reply: string | null;
};

export function initialQuestions(): DemoQuestion[] {
  return [
    {
      id: 1,
      body: "How do I keep praying when I don't feel anything?",
      anonymous: true,
      minutesAgo: 4320,
      reply: "Prayer rests on God's word, not on feelings. Keep a steady time, pray the scriptures you are reading, and let your faith lead your feelings.",
    },
    { id: 2, body: "Can I join SOGP again with a friend next cohort?", anonymous: false, minutesAgo: 300, reply: null },
  ];
}

export function initialDiscipleshipPosts(groups: Array<{ id: number; leaderId: string }>): DemoPost[] {
  return groups.flatMap((group, index) => [
    {
      id: 500 + index * 2,
      authorId: group.leaderId,
      kind: "discussion" as const,
      scope: `discipleship:${group.id}`,
      topic: "prayer" as const,
      title: "Prayer points for this week",
      body: "Share one thing you'd like the group to pray about.",
      likes: [],
      comments: [],
      minutesAgo: 200 + index * 30,
      pinned: true,
    },
  ]);
}

export function timeAgo(minutes: number): string {
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
  if (minutes < 2880) return "Yesterday";
  return `${Math.floor(minutes / 1440)}d`;
}
