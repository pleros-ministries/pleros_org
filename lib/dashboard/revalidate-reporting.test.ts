import { expect, test, vi } from "vitest";
const invalidations = vi.hoisted(() => vi.fn());
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: invalidations }));
import { revalidateReportingViews } from "./revalidate-reporting";

test("canonical activity changes refresh the new home as well as existing reporting views", () => {
  revalidateReportingViews();
  expect(invalidations).toHaveBeenCalledWith("/dashboard");
  expect(invalidations).toHaveBeenCalledWith("/dashboard/community/report");
  expect(invalidations).toHaveBeenCalledWith("/dashboard/church", "layout");
});
