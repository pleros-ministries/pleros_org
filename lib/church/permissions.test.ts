import { describe, expect, it } from "vitest";
import { canManageChurchAssignments, canReadChurchReport, validChurchParent, type ChurchAssignment } from "./permissions";
const pastor: ChurchAssignment = { userId: "p", role: "pastor", branchId: null, unitId: null, supervisorId: null };
const branch: ChurchAssignment = { userId: "b", role: "branch_pastor", branchId: 1, unitId: null, supervisorId: "p" };
const leader: ChurchAssignment = { userId: "l", role: "unit_leader", branchId: 1, unitId: 2, supervisorId: "b" };
const worker: ChurchAssignment = { userId: "w", role: "worker", branchId: 1, unitId: 2, supervisorId: "l" };
describe("church assignment permissions", () => {
  it("allows detail reads only inside approved organisational scope", () => {
    expect(canReadChurchReport(leader, worker)).toBe(true);
    expect(canReadChurchReport(leader, { ...worker, supervisorId: "other" })).toBe(false);
    expect(canReadChurchReport(leader, { ...worker, unitId: 3 })).toBe(false);
    expect(canReadChurchReport(leader, branch)).toBe(false);
    expect(canReadChurchReport(branch, worker)).toBe(true);
    expect(canReadChurchReport(branch, { ...worker, branchId: 9 })).toBe(false);
    expect(canReadChurchReport(pastor, { ...worker, branchId: 9 })).toBe(true);
    expect(canReadChurchReport(worker, leader)).toBe(false);
    expect(canReadChurchReport(null, worker)).toBe(false);
    expect(canReadChurchReport(leader, leader)).toBe(false);
  });
  it("keeps appointment authority with Pastor and Branch Pastors", () => {
    expect(canManageChurchAssignments(pastor)).toBe(true);
    expect(canManageChurchAssignments(branch)).toBe(true);
    expect(canManageChurchAssignments(leader)).toBe(false);
    expect(canManageChurchAssignments(worker)).toBe(false);
  });
  it("requires the correct parent tier, branch and unit", () => {
    expect(validChurchParent("branch_pastor", pastor, 1, null)).toBe(true);
    expect(validChurchParent("unit_leader", branch, 1, 2)).toBe(true);
    expect(validChurchParent("worker", leader, 1, 2)).toBe(true);
    expect(validChurchParent("worker", branch, 1, 2)).toBe(false);
    expect(validChurchParent("worker", leader, 9, 2)).toBe(false);
    expect(validChurchParent("worker", leader, 1, 3)).toBe(false);
    expect(validChurchParent("pastor", branch, null, null)).toBe(false);
  });
});
