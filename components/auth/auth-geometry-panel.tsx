import { cn } from "@/lib/utils";

import styles from "./auth-geometry-panel.module.css";

export function AuthGeometryPanel({ className }: { className?: string }) {
  return (
    <div className={cn(styles.panel, className)} aria-hidden="true">
      <svg
        className={styles.art}
        viewBox="0 0 540 760"
        preserveAspectRatio="xMidYMid slice"
        focusable="false"
      >
        <rect width="540" height="760" fill="var(--color-brand-blue)" />
        <circle cx="424" cy="116" r="52" fill="#f4dda2" />
        <circle cx="493" cy="350" r="172" fill="#98d8a1" />
        <circle cx="56" cy="330" r="206" fill="var(--color-brand-sky)" />
        <path
          d="M-34 438C50 382 140 377 211 415C288 457 347 539 397 638L452 760H-34V438Z"
          fill="#173e79"
        />
        <path
          d="M-24 321C77 325 149 372 190 446C216 493 235 552 259 618L304 760H-24V321Z"
          fill="#376fa9"
        />
        <path
          d="M212 362C212 318 248 282 292 282C336 282 372 318 372 362V535H212V362Z"
          fill="#e9785d"
        />
        <path
          d="M540 481C451 488 376 514 318 561C247 618 226 680 196 760H540V481Z"
          fill="#082862"
        />
        <path
          d="M545 449C418 470 326 522 279 585C234 645 210 703 190 760H302C319 701 337 657 382 614C426 572 480 550 545 542V449Z"
          fill="#f8edcf"
        />
        <path
          d="M-18 680C63 616 161 599 250 622C290 633 322 650 351 672C302 682 255 707 220 760H-18V680Z"
          fill="#0b2f6f"
        />
      </svg>
    </div>
  );
}
