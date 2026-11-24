import { describe, expect, it } from "vitest";
import { isPlanPath, isTeachingKey, learningGuid, learningPath, learningPosition, learningRequest, learningRevision, planPace, teachingKey } from "./learning-input";

describe("doctrinal journey keys", () => {
  it("keys Library teachings apart from podcast episodes", () => {
    expect(teachingKey(42)).toBe("teaching:42");
    expect(isTeachingKey("teaching:42")).toBe(true);
    expect(isTeachingKey("https://anchor.fm/episode-guid")).toBe(false);
  });
  it("treats podcast and doctrinal as plan paths, one a day unless two podcasts", () => {
    expect(isPlanPath("traditional")).toBe(false);
    expect(isPlanPath(null)).toBe(false);
    expect(["podcast_one","podcast_two","doctrinal"].every(path => isPlanPath(path as never))).toBe(true);
    expect(planPace("podcast_two")).toBe(2);
    expect(planPace("podcast_one")).toBe(1);
    expect(planPace("doctrinal")).toBe(1);
  });
});

describe("learning mutation inputs", () => {
  it.each([null,[],"text",42])("refuses a malformed request: %j", value => {
    expect(() => learningRequest(value)).toThrow();
  });
  it.each(["traditional","podcast_one","podcast_two","doctrinal"])("accepts the approved path %s", path => {
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
