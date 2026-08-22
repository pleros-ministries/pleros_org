export const SOGP_REWARDS = {
  completion_certificate: "Digital SOGP certificate",
  purpose_library: "Purpose learning library",
  community_alumni: "SOGP alumni community access",
} as const;

export type SogpRewardKey = keyof typeof SOGP_REWARDS;
