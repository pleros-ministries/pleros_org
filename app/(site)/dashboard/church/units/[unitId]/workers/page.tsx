import { redirect } from "next/navigation";

// Reads the session or params on every request (Cache Components).
export const instant = false;

/** Units and workers are retired (groups as oversight, 19 October); old links land on Oversight. */
export default function RetiredUnitPage() {
  redirect("/dashboard/community/oversight");
}
