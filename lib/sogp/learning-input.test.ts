import { describe, expect, it } from "vitest";
import { learningGuid, learningPath, learningPosition, learningRequest, learningRevision } from "./learning-input";

describe("learning mutation inputs", () => {
  it.each([null,[],"text",42])("refuses a malformed request: %j", value => {
    expect(() => learningRequest(value)).toThrow();
  });
  it.each(["traditional","podcast_one","podcast_two"])("accepts the approved path %s", path => {
    expect(learningPath(path)).toBe(path);
  });
  it("refuses unknown paths and untrusted revisions without coercion", () => {
    expect(() => learningPath("certificate")).toThrow();
    for (const value of ["1",-1,1.5,NaN,Infinity,2147483647,undefined]) expect(() => learningRevision(value)).toThrow();
    expect(learningRevision(0)).toBe(0);
    expect(learningRevision(12)).toBe(12);
  });
  it("accepts finite nonnegative playback, including zero and fractional seeks", () => {
    expect(learningPosition(0)).toBe(0);
    expect(learningPosition(285.25)).toBe(285.25);
    for (const value of ["5",-1,NaN,Infinity,-Infinity,undefined]) expect(() => learningPosition(value)).toThrow();
  });
  it("requires stable nonblank episode identity rather than silently trimming it", () => {
    expect(learningGuid("urn:episode:a")).toBe("urn:episode:a");
    for (const value of [""," "," a",42,null]) expect(() => learningGuid(value)).toThrow();
  });
});
