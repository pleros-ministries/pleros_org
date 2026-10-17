/* Decorative tile art for the You home. Every shape is aria-hidden; labels,
   values and actions are rendered in code beside it. Each tile keeps its own
   complementary palette so the blue My learning card stays the only blue hero. */

export type HomeArtName = "leaderboard" | "invite" | "group" | "share" | "podcast" | "welcome" | "preSogp" | "partner";

export function HomeArt({ name, className }: { name: HomeArtName; className?: string }) {
  const common = { className, "aria-hidden": true, focusable: false } as const;
  switch (name) {
    case "leaderboard":
      return <svg {...common} width="96" height="88" viewBox="0 0 96 88">
        <defs>
          <linearGradient id="home-art-podium-face" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3f8f86" /><stop offset="1" stopColor="#256a63" /></linearGradient>
          <linearGradient id="home-art-podium-side" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#1b4f4a" /><stop offset="1" stopColor="#143f3b" /></linearGradient>
        </defs>
        <g transform="translate(14 22)">
          <path d="M0 40h22l8-5v33l-8 5H0z" fill="url(#home-art-podium-side)" /><path d="M0 40h22l8-5H8z" fill="#6fb8ad" /><rect y="40" width="22" height="33" fill="url(#home-art-podium-face)" />
          <path d="M26 22h22l8-5v51l-8 5H26z" fill="url(#home-art-podium-side)" /><path d="M26 22h22l8-5H34z" fill="#ffd479" /><rect x="26" y="22" width="22" height="51" fill="url(#home-art-podium-face)" />
          <path d="M52 32h22l8-5v41l-8 5H52z" fill="url(#home-art-podium-side)" /><path d="M52 32h22l8-5H60z" fill="#6fb8ad" /><rect x="52" y="32" width="22" height="41" fill="url(#home-art-podium-face)" />
          <circle cx="40" cy="8" r="11" fill="#ffd479" opacity=".2" /><circle cx="40" cy="8" r="6" fill="#ffd479" />
        </g>
      </svg>;
    case "invite":
      return <svg {...common} width="92" height="84" viewBox="0 0 92 84">
        <path d="M6 70c18-4 24-16 38-18" fill="none" stroke="#79b52a" strokeWidth="2" strokeDasharray="3 5" strokeLinecap="round" />
        <g transform="translate(40 18)">
          <path d="M0 34 46 8 22 46z" fill="#c4ef7a" /><path d="M0 34 46 8 18 36z" fill="#e4fbb6" /><path d="M18 36 46 8 22 46z" fill="#9dd34a" /><path d="m18 36 4 10 2-7z" fill="#6f9e2a" />
        </g>
      </svg>;
    case "group":
      return <svg {...common} width="96" height="76" viewBox="0 0 96 76">
        <g transform="translate(16 18)">
          <ellipse cx="38" cy="54" rx="38" ry="7" fill="#c9b2f2" opacity=".6" />
          <circle cx="16" cy="22" r="9" fill="#b493ee" /><path d="M2 54c0-12 6-19 14-19s14 7 14 19z" fill="#9e77e6" />
          <circle cx="58" cy="22" r="9" fill="#b493ee" /><path d="M44 54c0-12 6-19 14-19s14 7 14 19z" fill="#9e77e6" />
          <circle cx="37" cy="14" r="11" fill="#7a4ad6" /><path d="M20 54c0-15 8-23 17-23s17 8 17 23z" fill="#5f2fbd" />
        </g>
      </svg>;
    case "share":
      return <svg {...common} width="90" height="84" viewBox="0 0 90 84">
        <g transform="translate(30 16) rotate(-8 24 30)">
          <rect x="4" y="6" width="46" height="58" rx="7" fill="#e8cf9f" /><rect width="46" height="58" rx="7" fill="#fff8ea" />
          <rect x="8" y="10" width="20" height="4" rx="2" fill="#f0a742" /><rect x="8" y="20" width="30" height="3" rx="1.5" fill="#d9c3a0" />
          <rect x="8" y="27" width="26" height="3" rx="1.5" fill="#d9c3a0" /><rect x="8" y="34" width="28" height="3" rx="1.5" fill="#d9c3a0" />
          <circle cx="36" cy="48" r="5" fill="#2056d6" />
        </g>
      </svg>;
    case "podcast":
      return <svg {...common} width="92" height="80" viewBox="0 0 92 80">
        <g transform="translate(26 18)">
          <path d="M6 40a28 28 0 0 1 56 0" fill="none" stroke="#e2b52c" strokeWidth="7" strokeLinecap="round" />
          <rect y="36" width="16" height="26" rx="6" fill="#f0c94a" /><rect x="52" y="36" width="16" height="26" rx="6" fill="#f0c94a" />
          <rect x="4" y="40" width="8" height="18" rx="4" fill="#b68a12" /><rect x="56" y="40" width="8" height="18" rx="4" fill="#b68a12" />
        </g>
      </svg>;
    case "welcome":
      return <svg {...common} width="92" height="80" viewBox="0 0 92 80">
        <g transform="translate(30 22)">
          <path d="m0 22 28-10 28 10-28 10z" fill="#9fd0ff" /><path d="m0 22 28 10v26L0 48z" fill="#5aa8f0" /><path d="M56 22 28 32v26l28-10z" fill="#3d8de0" />
          <path d="m14 17 28 10v26" fill="none" stroke="#d8ff65" strokeWidth="5" /><circle cx="28" cy="10" r="5" fill="#d8ff65" />
        </g>
      </svg>;
    case "preSogp":
      return <svg {...common} width="92" height="80" viewBox="0 0 92 80">
        <g transform="translate(28 22)">
          <rect x="6" y="6" width="54" height="38" rx="8" fill="#9db6f5" /><rect width="54" height="38" rx="8" fill="#2056d6" /><path d="m22 12 14 7-14 7z" fill="#d8ff65" />
          <rect y="46" width="54" height="5" rx="2.5" fill="#b9c9f7" /><rect y="46" width="30" height="5" rx="2.5" fill="#2056d6" />
        </g>
      </svg>;
    case "partner":
      return <svg {...common} width="92" height="80" viewBox="0 0 92 80">
        <g transform="translate(26 20)">
          <path d="m0 24 30-10 30 10-30 10z" fill="#f6b79c" /><path d="m0 24 30 10v24L0 48z" fill="#ec8b62" /><path d="M60 24 30 34v24l30-10z" fill="#d86a40" />
          <path d="m20 22 20-7" stroke="#7a2e12" strokeWidth="3" strokeLinecap="round" />
          <path d="M30 2c-3-4-10-2-8 4 1 3 8 7 8 7s7-4 8-7c2-6-5-8-8-4z" fill="#e5484d" />
        </g>
      </svg>;
  }
}
