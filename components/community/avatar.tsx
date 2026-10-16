import { avatarTone } from "./v3";

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Circular initial-avatar with a deterministic soft tone picked from the name. */
export function Avatar({
  name,
  size = 40,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const tone = avatarTone(name);
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        backgroundColor: tone.background,
        color: tone.color,
        fontSize: Math.round(size * 0.4),
      }}
      className={`inline-flex shrink-0 select-none items-center justify-center rounded-full font-medium leading-none ${className}`}
    >
      {initialsOf(name)}
    </span>
  );
}
