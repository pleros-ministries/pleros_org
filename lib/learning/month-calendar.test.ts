import { describe, expect, it } from "vitest";

import { buildMonthPlan, describeMonthSplit, monthWeeks, planMonth, type MonthActivity } from "./month-calendar";

describe("monthWeeks", () => {
  it("lays November 2026 out Monday first, the 1st a Sunday", () => {
    const weeks = monthWeeks("2026-11");
    expect(weeks).toHaveLength(6);
    expect(weeks[0]).toEqual([null, null, null, null, null, null, "2026-11-01"]);
    expect(weeks[1]![0]).toBe("2026-11-02");
    expect(weeks[5]).toEqual(["2026-11-30", null, null, null, null, null, null]);
  });

  it("starts December 2026 on a Tuesday and ends on Thursday the 31st", () => {
    const weeks = monthWeeks("2026-12");
    expect(weeks[0]).toEqual([null, "2026-12-01", "2026-12-02", "2026-12-03", "2026-12-04", "2026-12-05", "2026-12-06"]);
    expect(weeks.at(-1)).toEqual(["2026-12-28", "2026-12-29", "2026-12-30", "2026-12-31", null, null, null]);
  });

  it("keeps a short February to five weeks", () => {
    const weeks = monthWeeks("2026-02");
    expect(weeks).toHaveLength(5);
    expect(weeks.flat().filter(Boolean)).toHaveLength(28);
  });
});

describe("planMonth", () => {
  const items = Array.from({ length: 12 }, (_, index) => index + 1);

  it("fills the rest of the month and carries the remainder", () => {
    const plan = planMonth(items, { fromKey: "2026-11-25", endKey: "2026-11-30", perDay: 1 });
    expect(plan.days.map(day => day.dateKey)).toEqual(["2026-11-25", "2026-11-26", "2026-11-27", "2026-11-28", "2026-11-29", "2026-11-30"]);
    expect(plan.days[0]!.items).toEqual([1]);
    expect(plan.carried).toEqual([7, 8, 9, 10, 11, 12]);
  });

  it("takes two a day at the faster pace and stops when the items run out", () => {
    const plan = planMonth(items, { fromKey: "2026-11-25", endKey: "2026-11-30", perDay: 2 });
    expect(plan.days).toHaveLength(6);
    expect(plan.days[5]!.items).toEqual([11, 12]);
    expect(plan.carried).toEqual([]);
  });

  it("plans nothing for an empty path", () => {
    expect(planMonth([], { fromKey: "2026-12-01", endKey: "2026-12-31", perDay: 1 })).toEqual({ days: [], carried: [] });
  });
});

describe("buildMonthPlan", () => {
  const activity: MonthActivity = {
    learnt: {
      "2026-10-31": [{ title: "Last month", meta: "Part 1" }],
      "2026-11-03": [{ title: "The Reality of God’s Purpose", meta: "Part 1" }, { title: "The Reality of God’s Purpose", meta: "Part 2" }],
      "2026-11-10": [{ title: "The Reality of God’s Purpose", meta: "Part 3" }],
    },
    prayer: { "2026-11-03": 2, "2026-11-25": 1, "2026-11-26": 1 },
    bible: ["2026-11-10", "2026-10-30"],
  };
  const plan = Array.from({ length: 8 }, (_, index) => ({ title: "The Pursuit of God’s Purpose", meta: `Part ${index + 1}` }));

  it("puts what you did on its day and your plan from today", () => {
    const month = buildMonthPlan({ monthKey: "2026-11", todayKey: "2026-11-25", activity, plan });
    expect(month.days["2026-11-03"]!.learning).toEqual({ title: "The Reality of God’s Purpose", meta: "Part 1 · and 1 more", done: true });
    expect(month.days["2026-11-25"]!.learning).toMatchObject({ meta: "Part 1", done: false });
    expect(month.days["2026-11-25"]!.prayer).toBe(1);
    expect(month.rest.map(entry => entry.dateKey)).toEqual(["2026-11-25", "2026-11-26", "2026-11-27", "2026-11-28", "2026-11-29", "2026-11-30"]);
    expect(month.carried).toBe(2);
    expect(month.finishKey).toBe("2026-12-02");
    expect(month.counts).toEqual({ learnt: 2, prayer: 3, bible: 1 });
  });

  it("leaves last month and future records out", () => {
    const month = buildMonthPlan({ monthKey: "2026-11", todayKey: "2026-11-25", activity, plan: [] });
    expect(month.days["2026-10-31"]).toBeUndefined();
    expect(month.days["2026-11-26"]).toBeUndefined();
    expect(month.finishKey).toBeNull();
  });

  it("moves the plan to tomorrow once today's learning is done", () => {
    const month = buildMonthPlan({ monthKey: "2026-11", todayKey: "2026-11-10", activity, plan });
    expect(month.days["2026-11-10"]!.learning).toMatchObject({ meta: "Part 3", done: true });
    expect(month.rest[0]).toEqual({ dateKey: "2026-11-11", item: plan[0] });
    expect(month.finishKey).toBe("2026-11-18");
    expect(month.carried).toBe(0);
  });

  it("starts a new month empty, with the plan picking up where you are", () => {
    const month = buildMonthPlan({ monthKey: "2026-12", todayKey: "2026-12-01", activity, plan: plan.slice(5) });
    expect(Object.keys(month.days)).toEqual(["2026-12-01", "2026-12-02", "2026-12-03"]);
    expect(month.counts).toEqual({ learnt: 0, prayer: 0, bible: 0 });
  });
});

describe("describeMonthSplit", () => {
  it("splits a plan across the months it falls in", () => {
    expect(describeMonthSplit("2026-11-25", 30)).toBe("6 in what’s left of November and 24 in December");
    expect(describeMonthSplit("2026-11-25", 30, 2)).toBe("12 in what’s left of November and 48 in December");
    expect(describeMonthSplit("2026-12-01", 30)).toBe("30 in December");
    expect(describeMonthSplit("2027-01-31", 30)).toBe("1 in what’s left of January, 28 in February and 1 in March");
  });
});
