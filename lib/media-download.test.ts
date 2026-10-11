import { expect, test } from "vitest";
import { resolveMediaDownload } from "./media-download";
test("requests an attachment for unsigned public Cloudinary audio", () => {
  expect(resolveMediaDownload("https://res.cloudinary.com/demo/video/upload/v123/audio.mp3")).toEqual({ href: "https://res.cloudinary.com/demo/video/upload/fl_attachment/v123/audio.mp3", attachment: true });
});
test("does not invalidate signed media or transform unsupported providers", () => {
  for (const src of ["https://res.cloudinary.com/demo/video/upload/s--signed--/v123/audio.mp3", "https://res.cloudinary.com/demo/video/upload/v123/audio.mp3?__cld_token__=token", "https://example.com/audio.mp3"]) expect(resolveMediaDownload(src)).toEqual({ href: src, attachment: false });
});
test("supports local attachments and refuses non-media URL schemes", () => {
  expect(resolveMediaDownload("/audio.mp3")).toEqual({ href: "/audio.mp3", attachment: true });
  expect(resolveMediaDownload("javascript:alert(1)")).toBeNull();
});
