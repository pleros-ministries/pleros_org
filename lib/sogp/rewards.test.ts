import { expect, test } from "vitest";

import { SOGP_REWARDS } from "./rewards";

test("defines stable digital completion rewards", () => {
  expect(SOGP_REWARDS).toEqual({
    completion_certificate: "Digital SOGP certificate",
    purpose_library: "Purpose learning library",
    community_alumni: "SOGP alumni community access",
  });
});
