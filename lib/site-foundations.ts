export const siteNavItems = [
  { href: "/", label: "Home" },
  { href: "/style-demo", label: "Style demo" },
  { href: "/ppc", label: "PPC login" },
] as const;

export const styleDemoSections = [
  { id: "typography", label: "Typography" },
  { id: "buttons", label: "Buttons" },
  { id: "inputs", label: "Inputs" },
  { id: "surfaces", label: "Surfaces" },
  { id: "radii", label: "Radii" },
] as const;

export const themeSurfaceItems = [
  {
    id: "questions",
    label: "Questions",
    tone: "questions",
    badgeVariant: "questions",
    eyebrow: "Wonder and inquiry",
    description:
      "Warm, active surfaces for prompts, reflection, and open loops that still feel structured.",
  },
  {
    id: "purpose",
    label: "Purpose",
    tone: "purpose",
    badgeVariant: "purpose",
    eyebrow: "Clarity and direction",
    description:
      "Calm lavender surfaces that support narrative framing, goals, and positioning moments.",
  },
  {
    id: "fulfil",
    label: "Fulfil",
    tone: "fulfil",
    badgeVariant: "fulfil",
    eyebrow: "Action and growth",
    description:
      "Fresh green surfaces for next steps, proof points, and forward motion without feeling shouty.",
  },
] as const;

export const radiusScale = [
  { token: "--radius-sm", label: "Small", className: "rounded-[var(--radius-sm)]" },
  { token: "--radius-md", label: "Medium", className: "rounded-[var(--radius-md)]" },
  { token: "--radius-lg", label: "Large", className: "rounded-[var(--radius-lg)]" },
  { token: "--radius-xl", label: "Extra large", className: "rounded-[var(--radius-xl)]" },
  { token: "--radius-2xl", label: "2XL", className: "rounded-[var(--radius-2xl)]" },
  { token: "--radius-pill", label: "Pill", className: "rounded-[var(--radius-pill)]" },
] as const;
