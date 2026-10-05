import { describe, expect, test } from "vitest";

import {
  NO_DISCIPLESHIP_ACCESS,
  canViewDiscipleshipGroup,
  leadsDiscipleshipGroup,
  type DiscipleshipAccess,
} from "./discipleship-access";

const access: DiscipleshipAccess = { ledGroupIds: [4], joinedGroupIds: [9] };

describe("discipleship group access", () => {
  test("a discipler and a disciple can both see their group", () => {
    expect(canViewDiscipleshipGroup(access, 4)).toBe(true);
    expect(canViewDiscipleshipGroup(access, 9)).toBe(true);
  });

  test("nobody sees a group they are not part of", () => {
    expect(canViewDiscipleshipGroup(access, 5)).toBe(false);
    expect(canViewDiscipleshipGroup(NO_DISCIPLESHIP_ACCESS, 4)).toBe(false);
  });

  test("only the discipler leads a group", () => {
    expect(leadsDiscipleshipGroup(access, 4)).toBe(true);
    expect(leadsDiscipleshipGroup(access, 9)).toBe(false);
  });
});
