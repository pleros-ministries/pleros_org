import { redirect } from "next/navigation";

/** Units and workers are retired (groups as oversight, 19 October); old links land on Oversight. */
export default function RetiredUnitPage() {
  redirect("/dashboard/community/oversight");
}
