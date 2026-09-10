const PALETTE = [
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#dc2626",
  "#ea580c",
  "#ca8a04",
  "#15803d",
  "#0891b2",
  "#4f46e5",
  "#9333ea",
];

function hashOf(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return h;
}

function colorFor(seed: string) {
  return PALETTE[hashOf(seed || "?") % PALETTE.length];
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Circular initial-avatar with a deterministic colour picked from the name. */
export function Avatar({
  name,
  size = 40,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        backgroundColor: colorFor(name),
        fontSize: Math.round(size * 0.4),
      }}
      className={`inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold leading-none text-white ${className}`}
    >
      {initialsOf(name)}
    </span>
  );
}
