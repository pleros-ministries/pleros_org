/** Attachment links for public Cloudinary media; retain signed/other URLs as a new-tab fallback. */
export function resolveMediaDownload(src: string): { href: string; attachment: boolean } | null {
  if (src.startsWith("/") && !src.startsWith("//")) return { href: src, attachment: true };
  try {
    const url = new URL(src);
    if (!["https:", "http:"].includes(url.protocol)) return null;
    const unsignedCloudinary = url.hostname === "res.cloudinary.com" && url.pathname.includes("/video/upload/") && !url.pathname.includes("/s--") && !url.search;
    if (unsignedCloudinary) {
      if (!url.pathname.includes("fl_attachment")) url.pathname = url.pathname.replace("/video/upload/", "/video/upload/fl_attachment/");
      return { href: url.toString(), attachment: true };
    }
    return { href: src, attachment: false };
  } catch { return null; }
}
