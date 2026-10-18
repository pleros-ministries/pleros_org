import { describe, expect, test } from "vitest";
import { tabAfterSwipe } from "./swipe-tabs";

describe("dashboard swipe navigation", () => {
  test("swipes left to Community and right back to You", () => {
    expect(tabAfterSwipe("you", -140, 8, 250)).toBe("community");
    expect(tabAfterSwipe("community", 140, -8, 250)).toBe("you");
  });
  test("keeps vertical, diagonal and short gestures on the current tab", () => {
    for (const [dx,dy,time] of [[-20,200,250],[-100,80,250],[-40,0,250],[-40,0,1200]]) {
      expect(tabAfterSwipe("you",dx,dy,time)).toBe("you");
    }
  });
  test("a quick short flick switches tabs", () => {
    expect(tabAfterSwipe("you",-40,4,100)).toBe("community");
    expect(tabAfterSwipe("community",40,-4,100)).toBe("you");
    expect(tabAfterSwipe("you",-20,0,40)).toBe("you");
  });
  test("a deliberate drag can be held before release", () => {
    expect(tabAfterSwipe("you",-140,8,1500)).toBe("community");
  });
  test("does not wrap beyond the first or last tab", () => {
    expect(tabAfterSwipe("you",140,0,250)).toBe("you");
    expect(tabAfterSwipe("community",-140,0,250)).toBe("community");
  });
});
